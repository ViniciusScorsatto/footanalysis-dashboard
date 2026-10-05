import test from 'node:test';
import assert from 'node:assert/strict';
import {workerEnvironment} from '../scripts/online/worker-env.mjs';

test('worker environment forwards only its explicit runtime requirements', () => {
  const source = {PATH:'/usr/bin', LANG:'C.UTF-8', TZ:'UTC', TMPDIR:'/tmp',
    FOOT_ANALYSIS_DATA_DIR:'/data', FOOT_ANALYSIS_DB_PATH:'/data/custom.sqlite',
    GOOGLE_CLIENT_SECRET:'private', GOOGLE_CLIENT_ID:'private', ALLOWED_EMAIL:'private',
    FOOTBALL_API_KEY:'private', OPENAI_API_KEY:'private', GOOGLE_TTS_API_KEY:'private',
    RAILWAY_TOKEN:'private', NEW_UNKNOWN_CREDENTIAL:'private', NODE_OPTIONS:'--require=evil',
    LD_PRELOAD:'evil', HTTPS_PROXY:'https://user:password@example.com', NODE_ENV:'development'};
  const env = workerEnvironment(source);
  assert.deepEqual(env, {NODE_ENV:'production', FOOT_ANALYSIS_ONLINE:'1', PATH:'/usr/bin',
    LANG:'C.UTF-8', TZ:'UTC', TMPDIR:'/tmp', FOOT_ANALYSIS_DATA_DIR:'/data', FOOT_ANALYSIS_DB_PATH:'/data/custom.sqlite'});
  assert.equal(source.GOOGLE_CLIENT_SECRET, 'private');
  assert.notEqual(env, source);
});
