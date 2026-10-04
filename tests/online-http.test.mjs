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
  for(const route of ['/football/app.js','/football/layout.js','/football/studio.css','/online/player.js','/logos/team.png','/api/online/renders','/out/test.mp4']) {
    assert.equal((await fetch(url+route)).status,401,route);
  }
  for(const route of ['/football','/football/','/football-static','/football-static/','/online/preview']) {
    const response=await fetch(url+route,{redirect:'manual'});assert.equal(response.status,302);assert.equal(response.headers.get('location'),'/');
    const login=await fetch(url+route);assert.match(await login.text(),/Entrar com Google/);
  }
  assert.equal((await fetch(url+'/healthz')).status,200);
  const rejectedCookie = `fa_session=${store.createSession('other@example.com|other')}`;
  assert.equal((await fetch(url+'/api/online/renders',{headers:{cookie:rejectedCookie}})).status,401);
  const cookie = `fa_session=${store.createSession('owner@example.com|owner')}`;
  const headers = {cookie, origin:'https://private.example.com'};
  for (const route of ['/football/layout.js','/football/studio.css']) assert.equal((await fetch(url+route,{headers})).status,200);
  const asset=await fetch(url+'/football/app.js',{headers:{...headers,'accept-encoding':'gzip'}});
  assert.equal(asset.headers.get('content-encoding'),'gzip');
  assert.match(asset.headers.get('cache-control'),/private, no-cache, must-revalidate/);
  assert.match(await asset.text(),/loadOptions/);
  const etag=asset.headers.get('etag');assert.ok(etag);
  const cached=await fetch(url+'/football/app.js',{headers:{...headers,'if-none-match':etag}});
  assert.equal(cached.status,304);assert.equal(await cached.text(),'');
  assert.equal((await fetch(url+'/football/app.js',{headers:{'if-none-match':etag}})).status,401);
  const expiredToken=store.createSession('owner@example.com|expired');store.logout(expiredToken);
  assert.equal((await fetch(url+'/football/app.js',{headers:{cookie:`fa_session=${expiredToken}`,'if-none-match':etag}})).status,401);
  const identity=await fetch(url+'/football/app.js',{headers:{...headers,'accept-encoding':'gzip;q=0'}});
  assert.equal(identity.headers.get('content-encoding'),null);await identity.text();
  const partial=await fetch(url+'/football/app.js',{headers:{...headers,range:'bytes=0-9'}});
  assert.equal(partial.status,206);assert.equal(partial.headers.get('content-encoding'),null);assert.equal((await partial.text()).length,10);
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

test('static cache invalidates changed files while media remains uncached', async (t) => {
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'foot-static-cache-'));
  await fs.writeFile(path.join(dir,'app.js'),'const version = 1;');
  await fs.writeFile(path.join(dir,'video.mp4'),'video');
  const {server,url}=await listen((req,res)=>{void streamFile(req,res,dir,req.url.slice(1),undefined,{cacheStatic:true});});
  t.after(async()=>{server.closeAllConnections();server.close();await fs.rm(dir,{recursive:true,force:true});});
  const first=await fetch(url+'/app.js');const etag=first.headers.get('etag');await first.text();
  await fs.writeFile(path.join(dir,'app.js'),'const version = 200;');
  const changed=await fetch(url+'/app.js',{headers:{'if-none-match':etag}});
  assert.equal(changed.status,200);assert.notEqual(changed.headers.get('etag'),etag);assert.equal(await changed.text(),'const version = 200;');
  const head=await fetch(url+'/app.js',{method:'HEAD',headers:{'accept-encoding':'gzip'}});
  assert.equal(head.status,200);assert.equal(head.headers.get('content-encoding'),'gzip');assert.equal(await head.text(),'');
  const media=await fetch(url+'/video.mp4',{headers:{'accept-encoding':'gzip'}});
  assert.equal(media.headers.get('cache-control'),'private, no-store');assert.equal(media.headers.get('content-encoding'),null);assert.equal(media.headers.get('etag'),null);await media.text();
});

test('video storage supports authenticated downloads, single and bulk deletion across pages while preserving jobs', async (t) => {
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'foot-storage-test-'));
  const db=new Database(':memory:');
  const store=createOnlineStore(db);
  const api=createOnlineHttp({store,rendersRoot:dir,config:{PUBLIC_URL:'https://private.example.com',GOOGLE_CLIENT_ID:'client',GOOGLE_CLIENT_SECRET:'test-secret',ALLOWED_EMAIL:'owner@example.com'}});
  const {server,url}=await listen(async(req,res)=>{await api.handle(req,res,new URL(req.url,url));});
  t.after(async()=>{server.closeAllConnections();server.close();db.close();await fs.rm(dir,{recursive:true,force:true});});
  const headers={cookie:`fa_session=${store.createSession('owner@example.com|owner')}`,origin:'https://private.example.com'};
  const job={template:'results',compositionId:'FootballResultsShort',durationInFrames:30};
  const completed=[];
  for(let i=0;i<102;i++) {
    const row=store.enqueue({...job,outputName:`video-${i}.mp4`});store.claim();store.finish(row.id);completed.push(row.id);
    await fs.writeFile(path.join(dir,`${row.id}.mp4`),'0123456789');
  }
  const active=store.enqueue(job);store.claim();const queued=store.enqueue(job);
  await fs.writeFile(path.join(dir,`${active.id}.partial.mp4`),'active');
  await fs.writeFile(path.join(dir,'unrelated.txt'),'preserve');
  assert.equal((await fetch(url+'/api/online/storage')).status,401);
  assert.equal((await fetch(url+'/api/online/renders',{method:'DELETE'})).status,401);
  assert.equal((await fetch(url+'/api/online/renders',{method:'DELETE',headers:{...headers,origin:'https://evil.example','X-Confirm-Delete':'all-completed-mp4'}})).status,403);
  assert.equal((await fetch(url+'/api/online/renders',{method:'DELETE',headers})).status,400);
  assert.deepEqual((await (await fetch(url+'/api/online/storage',{headers})).json()).storage,{files:102,bytes:1020});
  const secondPage=await (await fetch(url+'/api/online/renders?page=1',{headers})).json();
  assert.equal(secondPage.renders.length,4);assert.equal(secondPage.renders[0].sizeBytes,10);
  const base=`/api/online/renders/${completed[0]}`;
  assert.equal((await fetch(url+base+'/download')).status,401);
  assert.equal(await (await fetch(url+base+'/download',{headers})).text(),'0123456789');
  assert.equal((await fetch(url+`/api/online/renders/${active.id}`,{method:'DELETE',headers})).status,409);
  assert.equal((await fetch(url+base,{method:'DELETE',headers})).status,200);
  assert.equal((await fetch(url+base+'/download',{headers})).status,410);
  assert.ok(store.get(completed[0]).snapshot);
  await assert.rejects(fs.stat(path.join(dir,`${completed[0]}.mp4`)),{code:'ENOENT'});
  const removed=await (await fetch(url+'/api/online/renders',{method:'DELETE',headers:{...headers,'X-Confirm-Delete':'all-completed-mp4'}})).json();
  assert.deepEqual(removed,{ok:true,deleted:101,freedBytes:1010});
  assert.deepEqual((await (await fetch(url+'/api/online/storage',{headers})).json()).storage,{files:0,bytes:0});
  assert.equal(store.get(active.id).state,'rendering');assert.equal(store.get(queued.id).state,'queued');
  for(const id of completed) {assert.ok(store.get(id).deleted_at);assert.ok(store.get(id).snapshot);}
  assert.deepEqual((await fs.readdir(dir)).sort(),[`${active.id}.partial.mp4`,'unrelated.txt'].sort());
  assert.equal((await fetch(url+base+'/retry',{method:'POST',headers})).status,202);
});
