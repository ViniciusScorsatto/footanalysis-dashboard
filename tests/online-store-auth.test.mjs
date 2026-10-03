import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import {createOnlineStore, RETENTION_MS} from '../scripts/online/store.mjs';
import {verifyGoogleIdentity, createAuth} from '../scripts/online/auth.mjs';

test('queue snapshots are immutable, serial, recoverable and expire from completion', () => {
  const db = new Database(':memory:');
  let now = 1000;
  const store = createOnlineStore(db, () => now);
  const input = {fixtures: [{homeScore: 1}]};
  const first = store.enqueue(input);
  input.fixtures[0].homeScore = 9;
  const second = store.enqueue(input);
  assert.equal(JSON.parse(store.get(first.id).snapshot).fixtures[0].homeScore, 1);
  assert.equal(store.claim().id, first.id);
  assert.equal(store.claim(), null);
  now += 300000;
  store.finish(first.id);
  assert.equal(store.get(first.id).expires_at, now + RETENTION_MS);
  assert.equal(store.claim().id, second.id);
  store.recover();
  assert.equal(store.get(second.id).state, 'failed');
  const retry = store.retry(second.id);
  assert.notEqual(retry.id, second.id);
  assert.equal(store.claim().id, retry.id);
  store.cancel(retry.id);
  store.finish(retry.id);
  assert.equal(store.get(retry.id).state, 'cancelled');
  const waiting = store.enqueue({});
  store.cancel(waiting.id);
  assert.equal(store.claim(), null);
  now += RETENTION_MS;
  assert.deepEqual(store.expired().map((r) => r.id), [first.id]);
  store.markDeleted(first.id);
  assert.equal(store.expired().length, 0);
  assert.ok(store.get(first.id).snapshot);
  db.close();
});

test('sessions expire after seven days; OAuth state is single-use', () => {
  const db = new Database(':memory:');
  let now = 1000;
  const store = createOnlineStore(db, () => now);
  const token = store.createSession('google-sub');
  assert.equal(store.session(token).subject, 'google-sub');
  assert.equal(store.session('wrong'), null);
  const flow = store.startOAuth();
  assert.equal(store.consumeOAuth(flow.state).nonce, flow.nonce);
  assert.equal(store.consumeOAuth(flow.state), undefined);
  now += 7 * 86400000;
  assert.equal(store.session(token), null);
  const other = store.createSession('google-sub');
  store.logout(other);
  assert.equal(store.session(other), null);
  db.close();
});

test('Google identity verifies signature, issuer, audience, nonce and allowed verified email', async () => {
  const {privateKey, publicKey} = crypto.generateKeyPairSync('rsa', {modulusLength: 2048});
  const jwk = {...publicKey.export({format: 'jwk'}), kid: 'test'};
  const claims = {iss: 'https://accounts.google.com', aud: 'client', sub: 'subject', email: 'owner@example.com', email_verified: true, nonce: 'nonce', iat: 1000, exp: 2000};
  const sign = (body) => {
    const parts = [Buffer.from(JSON.stringify({alg: 'RS256', kid: 'test'})).toString('base64url'), Buffer.from(JSON.stringify(body)).toString('base64url')];
    return [...parts, crypto.sign('RSA-SHA256', Buffer.from(parts.join('.')), privateKey).toString('base64url')].join('.');
  };
  const config = {clientId: 'client', email: 'owner@example.com', nonce: 'nonce', now: 1500000, fetchImpl: async () => ({ok: true, json: async () => ({keys: [jwk]})})};
  assert.equal((await verifyGoogleIdentity(sign(claims), config)).sub, 'subject');
  for (const change of [{email: 'someone@example.com'}, {email_verified: false}, {aud: 'other'}, {iss: 'evil'}, {nonce: 'other'}, {exp: 1400}, {iat: 9999}]) {
    await assert.rejects(verifyGoogleIdentity(sign({...claims, ...change}), config));
  }
  const forged = sign(claims).split('.');
  forged[1] = Buffer.from(JSON.stringify({...claims, sub: 'attacker'})).toString('base64url');
  await assert.rejects(verifyGoogleIdentity(forged.join('.'), config));
});

test('production auth requires HTTPS and validates exact write origin', () => {
  const config = {store: {}, clientId: 'client', clientSecret: 'secret', allowedEmail: 'owner@example.com'};
  assert.throws(() => createAuth({...config, origin: 'http://localhost'}));
  const auth = createAuth({...config, origin: 'https://dashboard.example.com'});
  assert.equal(auth.validWrite({headers: {origin: 'https://dashboard.example.com'}}), true);
  assert.equal(auth.validWrite({headers: {origin: 'https://attacker.example.com'}}), false);
  assert.equal(auth.validWrite({headers: {}}), false);
});
