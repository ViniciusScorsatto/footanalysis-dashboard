import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import {createOnlineStore} from '../scripts/online/store.mjs';
import {createOnlineHttp} from '../scripts/online/http.mjs';

test('auth epoch migration preserves existing records and revocation survives SQLite reopening',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'foot-session-revoke-'));
  const file=path.join(dir,'test.sqlite');let db=new Database(file);
  try {
    const before=createOnlineStore(db);
    const token=before.createSession('owner@example.com|owner');const job=before.enqueue({name:'preserved'});
    // Simulate the previous deployed schema before the additive migration.
    db.exec('DROP TABLE online_auth_epoch; DELETE FROM online_schema_migrations WHERE version=2');
    db.close();db=new Database(file);
    const upgraded=createOnlineStore(db);assert.ok(upgraded.session(token));assert.ok(upgraded.get(job.id));
    const inflight=upgraded.consumeOAuth(upgraded.startOAuth().state);
    upgraded.logoutAll();db.close();db=new Database(file);
    const reopened=createOnlineStore(db);assert.equal(reopened.session(token),null);
    assert.throws(()=>reopened.createSession('owner@example.com|owner',inflight.epoch),/revoked/);
    assert.ok(reopened.get(job.id));
  } finally {if(db.open)db.close();await fs.rm(dir,{recursive:true,force:true});}
});

test('logout all blocks unauthenticated/foreign-origin requests, revokes every device and pending login, preserves jobs',async t=>{
  const db=new Database(':memory:');const store=createOnlineStore(db);
  const config={PUBLIC_URL:'https://private.example.com',GOOGLE_CLIENT_ID:'test',GOOGLE_CLIENT_SECRET:'test',ALLOWED_EMAIL:'owner@example.com'};
  const api=createOnlineHttp({store,config});
  const server=http.createServer((req,res)=>api.handle(req,res,new URL(req.url,'http://localhost')));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>{server.closeAllConnections();server.close();db.close();});
  const base=`http://127.0.0.1:${server.address().port}`;
  const first=store.createSession('owner@example.com|owner');const second=store.createSession('owner@example.com|owner');
  const pending=store.startOAuth();const inFlight=store.consumeOAuth(store.startOAuth().state);
  const render=store.enqueue({template:'results'});
  for(const headers of [{origin:config.PUBLIC_URL},{origin:'https://evil.test',cookie:`fa_session=${first}`},{cookie:`fa_session=${first}`}]) {
    const r=await fetch(base+'/auth/logout-all',{method:'POST',headers,redirect:'manual'});
    assert.ok([401,403].includes(r.status));assert.ok(store.session(first));assert.ok(store.session(second));
  }
  assert.equal((await fetch(base+'/auth/logout-all',{headers:{cookie:`fa_session=${first}`},redirect:'manual'})).status,404);
  const response=await fetch(base+'/auth/logout-all',{method:'POST',headers:{origin:config.PUBLIC_URL,cookie:`fa_session=${first}`},redirect:'manual'});
  assert.equal(response.status,302);assert.equal(response.headers.get('location'),'/');
  assert.match(response.headers.get('set-cookie'),/fa_session=;.*Max-Age=0/);
  assert.match(response.headers.get('set-cookie'),/fa_oauth=;.*Max-Age=0/);
  for(const token of [first,second]) assert.equal((await fetch(base+'/api/online/renders',{headers:{cookie:`fa_session=${token}`}})).status,401);
  assert.equal(store.consumeOAuth(pending.state),undefined);
  assert.throws(()=>store.createSession('owner@example.com|owner',inFlight.epoch),/revoked/);
  assert.equal(store.get(render.id).state,'queued');
  const reopened=createOnlineStore(db);assert.equal(reopened.session(first),null);
  const next=reopened.consumeOAuth(reopened.startOAuth().state);
  assert.ok(reopened.session(reopened.createSession('owner@example.com|owner',next.epoch)));
});
