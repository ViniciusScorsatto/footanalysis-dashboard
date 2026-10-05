// Explicitly invoked inside a disposable validation container, never in production.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {getDb} from '../scripts/lib/db.mjs';
import {createOnlineStore} from '../scripts/online/store.mjs';
if (process.env.PUBLIC_URL !== 'https://validation.invalid') throw new Error('Validation environment only');
if (process.env.FOOT_ANALYSIS_CONTAINER === '1') {
  const supervisor = await fs.readFile('/proc/1/status', 'utf8');
  assert.match(supervisor, /^Uid:\s+1000\s+1000\s+1000\s+1000$/m);
  assert.match(supervisor, /^Gid:\s+1000\s+1000\s+1000\s+1000$/m);
  assert.equal(process.getuid(), 1000, 'Run container validation with --user 1000:1000');
  await assert.rejects(fs.access('/app/package.json', fs.constants.W_OK));
}
const db=getDb(), store=createOnlineStore(db);
let fixtureUrl;
if (process.env.FOOT_ANALYSIS_TEST_FIXTURES) fixtureUrl = pathToFileURL(process.env.FOOT_ANALYSIS_TEST_FIXTURES).href;
else {
  const {build} = await import('esbuild');
  const built=await build({entryPoints:['tests/online-fixtures.ts'],bundle:true,write:false,platform:'node',format:'esm'});
  fixtureUrl = `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`;
}
const {jobs}=await import(fixtureUrl);
const job={...jobs[0],durationInFrames:30,videoMode:'static'};
const token=store.createSession(`${process.env.ALLOWED_EMAIL}|validation`);
const headers={cookie:`fa_session=${token}`,origin:process.env.PUBLIC_URL,'content-type':'application/json'};
async function request(route,method='GET',body) {
  return fetch('http://127.0.0.1:8080'+route,{method,headers,body:body?JSON.stringify(body):undefined});
}
try {
  const options=await (await request('/api/football/options')).json();
  assert.ok(options.templates.length);
  assert.equal((await fetch('http://127.0.0.1:8080/api/online/renders')).status,401);
  const first=store.preview(job);
  const started=Date.now();
  const response=await request('/api/football/jobs/render','POST',{previewId:first});
  assert.equal(response.status,202);
  assert.ok(Date.now()-started<2000);
  const a=(await response.json()).render;
  const b=store.enqueue({...job,leagueName:'Second snapshot'});
  job.leagueName='Edited while rendering';
  const cancelled=store.enqueue(job);store.cancel(cancelled.id);
  assert.equal(store.get(cancelled.id).state,'cancelled');
  const limit=Date.now()+180000;
  while (Date.now()<limit && [a,b].some(row=>['queued','rendering'].includes(store.get(row.id).state))) await new Promise(r=>setTimeout(r,500));
  for (const row of [a,b]) {
    assert.equal(store.get(row.id).state,'completed',JSON.stringify(store.get(row.id)));
    assert.notEqual(JSON.parse(store.get(row.id).snapshot).leagueName,job.leagueName);
    const range=await request(`/api/online/renders/${row.id}/download`,'GET');assert.equal(range.status,200);await range.arrayBuffer();
    assert.equal((await fetch(`http://127.0.0.1:8080/api/online/renders/${row.id}/download`)).status,401);
  }
  await fs.writeFile('/data/config/validation-preserved.txt','preserved');
  await fs.writeFile('/data/validation.json',JSON.stringify({ids:[a.id,b.id]}));
  console.log('PASS: 202, two actual renders, snapshot isolation, queued cancellation, protected downloads');
} finally {store.logout(token);}
