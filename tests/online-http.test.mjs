import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import {createOnlineStore} from '../scripts/online/store.mjs';
import {createOnlineHttp} from '../scripts/online/http.mjs';
import {streamFile} from '../scripts/online/files.mjs';

async function listen(handler) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {server, url: `http://127.0.0.1:${server.address().port}`};
}
test('private middleware protects every surface and rejects excluded routes and foreign origins', async (t) => {
  const db = new Database(':memory:');
  const store = createOnlineStore(db);
  const api = createOnlineHttp({store, config: {PUBLIC_URL: 'https://private.example.com', GOOGLE_CLIENT_ID: 'client', GOOGLE_CLIENT_SECRET: 'test-secret', ALLOWED_EMAIL: 'owner@example.com'}});
  const {server, url} = await listen(async (req, res) => {if (!await api.handle(req,res,new URL(req.url,url))) {res.writeHead(200);res.end('legacy');}});
  t.after(() => {server.closeAllConnections();server.close();db.close();});
  for(const route of ['/football','/football/app.js','/online/player.js','/online/preview','/logos/team.png','/api/online/renders','/out/test.mp4']) {
    assert.equal((await fetch(url+route)).status,401,route);
  }
  assert.equal((await fetch(url+'/healthz')).status,200);
  const rejectedCookie = `fa_session=${store.createSession('other@example.com|other')}`;
  assert.equal((await fetch(url+'/api/online/renders',{headers:{cookie:rejectedCookie}})).status,401);
  const cookie = `fa_session=${store.createSession('owner@example.com|owner')}`;
  const headers = {cookie, origin:'https://private.example.com'};
  assert.equal((await fetch(url+'/api/online/renders',{headers})).status,200);
  for (const route of ['/api/football/publishing/youtube/upload','/api/football/thumbnails/render','/api/football/longform/render','/api/football/short-visual/generate']) {
    assert.equal((await fetch(url+route,{method:'POST',headers})).status,404,route);
  }
  assert.equal((await fetch(url+'/api/football/jobs/render',{method:'POST',headers:{cookie,origin:'https://evil.example'}})).status,403);
  const before=await fetch(url+'/auth/google',{redirect:'manual'});
  assert.equal(before.status,302);
  assert.match(before.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Lax/);
  assert.match(before.headers.get('location'),/code_challenge_method=S256/);
  assert.equal((await fetch(url+'/auth/google/callback?state=wrong&code=x')).status,403);
  const id=api.preview({template:'results',compositionId:'FootballResultsShort',durationInFrames:300});
  assert.equal((await fetch(url+'/api/online/previews/'+id,{headers})).status,200);
  const job=api.enqueue({template:'results',compositionId:'FootballResultsShort',durationInFrames:300});
  assert.equal((await fetch(url+`/api/online/renders/${job.id}/download`,{headers})).status,410);
  await fetch(url+`/api/online/renders/${job.id}/cancel`,{method:'POST',headers});
  const retry=await fetch(url+`/api/online/renders/${job.id}/retry`,{method:'POST',headers});
  assert.equal(retry.status,202);
  assert.notEqual((await retry.json()).render.id,job.id);
});

test('streaming supports mobile ranges and rejects traversal and symlink escapes', async (t) => {
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'foot-online-files-'));
  const base=path.join(dir,'public');await fs.mkdir(base);
  await fs.writeFile(path.join(base,'video.mp4'),'0123456789');
  await fs.writeFile(path.join(dir,'secret.txt'),'private');
  await fs.symlink(path.join(dir,'secret.txt'),path.join(base,'escape.txt'));
  const {server,url}=await listen((req,res)=>{const relative=new URL(req.url,url).searchParams.get('file')||'video.mp4';void streamFile(req,res,base,relative);});
  t.after(async()=>{server.closeAllConnections();server.close();await fs.rm(dir,{recursive:true,force:true});});
  const response=await fetch(url,{headers:{range:'bytes=2-5'}});
  assert.equal(response.status,206);assert.equal(response.headers.get('content-range'),'bytes 2-5/10');assert.equal(await response.text(),'2345');
  assert.equal(await (await fetch(url,{headers:{range:'bytes=-3'}})).text(),'789');
  assert.equal((await fetch(url,{headers:{range:'bytes=20-30'}})).status,416);
  assert.equal((await fetch(url+'?file=../secret.txt')).status,404);
  assert.equal((await fetch(url+'?file=escape.txt')).status,404);
  assert.equal((await fetch(url,{method:'HEAD'})).headers.get('content-length'),'10');
});
