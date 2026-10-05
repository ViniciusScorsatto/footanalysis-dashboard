import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import Database from 'better-sqlite3';
import {createOnlineStore} from '../scripts/online/store.mjs';
import {createOnlineHttp} from '../scripts/online/http.mjs';
import {createRequestLimits} from '../scripts/online/security.mjs';
import {escapeHtml} from '../dashboard/football/helpers.js';

test('login throttling precedes writes, ignores forged proxy headers and recovers; health stays available', async (t) => {
  let now = 1000;
  const db = new Database(':memory:');
  const store = createOnlineStore(db, () => now);
  const api = createOnlineHttp({store, limits: createRequestLimits({now: () => now}), config: {
    PUBLIC_URL: 'https://private.example.com', GOOGLE_CLIENT_ID: 'client', GOOGLE_CLIENT_SECRET: 'secret', ALLOWED_EMAIL: 'owner@example.com',
  }});
  const server = http.createServer(async (req, res) => api.handle(req, res, new URL(req.url, 'http://localhost')));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => {server.closeAllConnections(); server.close(); db.close();});
  const base = `http://127.0.0.1:${server.address().port}`;
  for (let i = 0; i < 10; i++) assert.equal((await fetch(base + '/auth/google', {redirect: 'manual'})).status, 302);
  const blocked = await fetch(base + '/auth/google', {redirect: 'manual', headers: {'x-forwarded-for': '192.0.2.123'}});
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get('retry-after'), '60');
  assert.equal(db.prepare('SELECT count(*) n FROM online_oauth').get().n, 10);
  assert.equal((await fetch(base + '/healthz')).status, 200);
  now += 60000;
  assert.equal((await fetch(base + '/auth/google', {redirect: 'manual'})).status, 302);
  const cookie = `fa_session=${store.createSession('owner@example.com|owner')}`;
  const response = await fetch(base + '/football', {headers: {cookie}});
  const policy = response.headers.get('content-security-policy');
  const html = await response.text();
  assert.ok(policy.includes("object-src 'none'"));
  assert.ok(policy.includes("base-uri 'none'"));
  assert.ok(!policy.includes('unsafe-eval'));
  assert.ok(policy.includes("media-src 'self' https: blob: data:"));
  const nonce = html.match(/<script nonce="([^"]+)"/)[1];
  assert.ok(policy.includes(`'nonce-${nonce}'`));
  assert.match(response.headers.get('strict-transport-security'), /max-age=31536000/);
  const second = await fetch(base + '/football', {headers: {cookie}});
  assert.notEqual(second.headers.get('content-security-policy'), policy);
  while (db.prepare('SELECT count(*) n FROM online_oauth').get().n < 100) store.startOAuth();
  now += 60000;
  const full = await fetch(base + '/auth/google', {redirect: 'manual'});
  assert.equal(full.status, 429);
  assert.equal(full.headers.get('retry-after'), '600');
  assert.equal(db.prepare('SELECT count(*) n FROM online_oauth').get().n, 100);
});

test('OAuth storage is bounded, does not evict valid flows, and prunes on insertion', () => {
  let now = 1000;
  const db = new Database(':memory:');
  try {
    const store = createOnlineStore(db, () => now);
    const first = store.startOAuth();
    for (let i = 1; i < 100; i++) store.startOAuth();
    assert.throws(() => store.startOAuth(), {code: 'OAUTH_CAPACITY'});
    assert.ok(store.consumeOAuth(first.state));
    store.startOAuth();
    now += 600001;
    store.startOAuth();
    assert.equal(db.prepare('SELECT count(*) n FROM online_oauth').get().n, 1);
  } finally {db.close();}
});

test('write and overall budgets are bounded and reset without trusting client identity', () => {
  let now = 0;
  const limits = createRequestLimits({now: () => now});
  const url = new URL('https://private.example.com/api/football/jobs/prepare');
  for (let i = 0; i < 60; i++) assert.equal(limits.check({method: 'POST'}, url), 0);
  assert.equal(limits.check({method: 'POST'}, url), 60);
  now += 60000;
  for (let i = 0; i < 600; i++) assert.equal(limits.check({method: 'GET'}, url), 0);
  assert.equal(limits.check({method: 'GET'}, url), 60);
  assert.equal(limits.check({method: 'GET'}, new URL('https://private.example.com/healthz')), 0);
});

test('rounds and prediction attributes escape untrusted API strings before generating HTML', async () => {
  const source = await fs.readFile(new URL('../dashboard/football/app.js', import.meta.url), 'utf8');
  const attack = '\"><img src=x onerror="alert(1)">';
  const roundSelect = {innerHTML: ''};
  const predictionEditorList = {innerHTML: ''};
  const context = vm.createContext({escapeHtml, roundSelect, predictionEditorList,
    templateSelect: {value: 'predictions'}, form: {elements: {leagueId: {value: '71'}}},
    UPCOMING_FIXTURE_TEMPLATES: new Set(), currentPredictionFixtures: [],
    updateLocalizedDefaults() {}, updateDashboardMeta() {},
  });
  for (const name of ['setRoundOptions', 'renderPredictionEditor']) {
    const start = source.indexOf(`const ${name} =`);
    const end = source.indexOf('\n};', start);
    assert.ok(start > 0 && end > start);
    vm.runInContext(source.slice(start, end + 3) + `\nthis.${name} = ${name};`, context);
  }
  context.setRoundOptions([attack]);
  context.renderPredictionEditor([{fixtureId: attack, homeScore: attack, awayScore: 0, homeTeam: attack, awayTeam: attack}]);
  assert.ok(roundSelect.innerHTML.includes(escapeHtml(attack)));
  assert.ok(predictionEditorList.innerHTML.includes(`aria-label="${escapeHtml(attack)} score"`));
  for (const html of [roundSelect.innerHTML, predictionEditorList.innerHTML]) assert.ok(!html.includes('<img'));
});
