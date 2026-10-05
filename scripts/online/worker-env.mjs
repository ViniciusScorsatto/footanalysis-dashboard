// An allowlist, not a secret-name denylist: newly added server credentials must
// never leak into the worker or the Chromium/ffmpeg processes it spawns.
const workerKeys = [
  'PATH', 'LANG', 'LC_ALL', 'TZ', 'TMPDIR', 'TMP', 'TEMP', 'SystemRoot', 'WINDIR',
  'FOOT_ANALYSIS_DATA_DIR', 'FOOT_ANALYSIS_DB_PATH',
];
export function workerEnvironment(source = process.env) {
  const env = {NODE_ENV: 'production', FOOT_ANALYSIS_ONLINE: '1'};
  for (const key of workerKeys) if (typeof source[key] === 'string') env[key] = source[key];
  return env;
}
