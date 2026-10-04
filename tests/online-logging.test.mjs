import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {jobContext, logEvent, publicFailure, redact, traceRequest} from '../scripts/online/logging.mjs';

test('logs redact credentials, URLs, nested secrets and email addresses', () => {
  const previous = process.env.FOOTBALL_API_KEY;
  process.env.FOOTBALL_API_KEY = 'test-private-api-value';
  const original = console.error;
  let line;
  console.error = (value) => {line = value;};
  try {
    logEvent('test_failure', {
      error: new Error('API failed: test-private-api-value https://user:pass@example.com/api?key=hidden Bearer bearer-value'),
      nested: {access_token: 'nested-secret', message: 'x-apisports-key: header-secret user@example.com'},
    }, 'error');
    for (const secret of ['test-private-api-value', 'user:pass', 'key=hidden', 'bearer-value', 'nested-secret', 'header-secret', 'user@example.com']) assert.ok(!line.includes(secret), secret);
    assert.equal(JSON.parse(line).event, 'test_failure');
    assert.ok(line.includes('API failed'));
    assert.ok(!redact('client_secret="quoted secret"').includes('quoted secret'));
  } finally {
    console.error = original;
    if (previous === undefined) delete process.env.FOOTBALL_API_KEY;
    else process.env.FOOTBALL_API_KEY = previous;
  }
});

test('job metadata excludes narration, credentials and arbitrary request body fields', () => {
  assert.deepEqual(jobContext({template: 'results', leagueId: 5, voiceoverEnabled: false, voiceoverText: 'private text', token: 'secret', fixtureEdits: [{id: 1}]}), {template: 'results', leagueId: 5, voiceoverEnabled: false});
});

test('public errors correlate with server logs without exposing internal details', () => {
  const lines = [];
  const originalLog = console.log;
  const originalError = console.error;
  console.log = console.error = (line) => lines.push(JSON.parse(line));
  try {
    const req = {method: 'POST'};
    const res = Object.assign(new EventEmitter(), {setHeader(name, value) {this[name] = value;}, statusCode: 500});
    traceRequest(req, res, new URL('https://example.com/api/football/jobs/prepare?token=private'));
    Object.assign(req.diagnostic, jobContext({template: 'results', season: 2026}));
    const body = publicFailure(res, 500, new Error('SQLITE_CANTOPEN: database unavailable'));
    res.emit('finish');
    assert.equal(body.errorId, res['X-Request-Id']);
    assert.ok(body.error.includes(body.errorId));
    assert.ok(!JSON.stringify(body).includes('SQLITE'));
    assert.equal(lines[1].requestId, body.errorId);
    assert.equal(lines[1].template, 'results');
    assert.match(lines[1].error.message, /SQLITE_CANTOPEN/);
    assert.equal(lines[2].status, 500);
    assert.ok(!JSON.stringify(lines).includes('token=private'));
  } finally {console.log = originalLog;console.error = originalError;}
});
