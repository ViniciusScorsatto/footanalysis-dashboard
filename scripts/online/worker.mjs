import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises';
import {renderMedia, selectComposition, makeCancelSignal} from '@remotion/renderer';
import {getDb} from '../lib/db.mjs';
import {createOnlineStore} from './store.mjs';
import {root, outputRoot, publicRoot} from './paths.mjs';
import {streamFile} from './files.mjs';
import {jobContext, logEvent} from './logging.mjs';

const store = createOnlineStore(getDb());
store.recover();
await fs.mkdir(outputRoot, {recursive: true});
for (const filename of await fs.readdir(outputRoot)) {
  if (/^[a-f0-9-]{36}\.partial\.mp4$/.test(filename)) await fs.rm(path.join(outputRoot, filename), {force: true});
  if (/^[a-f0-9-]{36}\.mp4$/.test(filename) && store.get(filename.slice(0,-4))?.state !== 'completed') {
    await fs.rm(path.join(outputRoot,filename), {force:true});
  }
}
const bundleRoot = path.join(root, 'build/online/render');
const server = http.createServer((request, response) => {
  let pathname;
  try {pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);} catch {response.writeHead(400); response.end(); return;}
  // This renderer-only asset server is bound to loopback, never Railway's public PORT.
  const asset = pathname.startsWith('/public/');
  void streamFile(request, response, asset ? publicRoot : bundleRoot, asset ? pathname.slice(8) : pathname === '/' ? 'index.html' : pathname.slice(1));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const serveUrl = `http://127.0.0.1:${server.address().port}`;
let stopping = false;
let cancelCurrent;
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {stopping = true; cancelCurrent?.();});

async function cleanup() {
  for (const row of store.expired()) {
    await fs.rm(path.join(outputRoot, `${row.id}.mp4`), {force: true});
    store.markDeleted(row.id);
  }
  store.pruneAuth();
}
await cleanup();
let lastCleanup = Date.now();
logEvent('worker_ready', {concurrency: 1});
while (!stopping) {
  if (Date.now() - lastCleanup > 3600000) {await cleanup(); lastCleanup = Date.now();}
  const row = store.claim();
  if (!row) {await new Promise((resolve) => setTimeout(resolve, 1000)); continue;}
  const {cancel, cancelSignal} = makeCancelSignal();
  cancelCurrent = cancel;
  const partial = path.join(outputRoot, `${row.id}.partial.mp4`);
  const output = path.join(outputRoot, `${row.id}.mp4`);
  const timer = setInterval(() => {if (store.get(row.id)?.cancel_requested) cancel();}, 500);
  let timedOut = false;
  const deadline = setTimeout(() => {timedOut = true; cancel();}, 30 * 60 * 1000);
  const start = Date.now();
  let stage = 'select_composition';
  try {
    const inputProps = {job: JSON.parse(row.snapshot)};
    logEvent('render_started', {renderId: row.id, ...jobContext(inputProps.job)});
    const composition = await selectComposition({serveUrl, id: 'OnlineShort', inputProps});
    stage = 'render_media';
    logEvent('render_composition_ready', {renderId: row.id, durationInFrames: composition.durationInFrames, fps: composition.fps});
    await renderMedia({serveUrl, composition, inputProps, outputLocation: partial, codec: 'h264', audioCodec: 'aac', pixelFormat: 'yuv420p', concurrency: 1, cancelSignal, chromiumOptions: {enableMultiProcessOnLinux: true}, onProgress: ({progress}) => store.progress(row.id, progress)});
    if (store.get(row.id)?.cancel_requested) throw new Error('cancelled');
    stage = 'save_output';
    await fs.rename(partial, output);
    store.finish(row.id);
    if (store.get(row.id)?.state !== 'completed') await fs.rm(output, {force: true});
    logEvent(store.get(row.id)?.state === 'completed' ? 'render_completed' : 'render_cancelled', {renderId: row.id, elapsedMs: Date.now() - start});
  } catch (error) {
    const cancelled = Boolean(store.get(row.id)?.cancel_requested);
    logEvent(cancelled ? 'render_cancelled' : 'render_failed', {renderId: row.id, stage, elapsedMs: Date.now() - start, timedOut, stopping, error}, cancelled ? 'info' : 'error');
    store.finish(row.id, `${stopping ? 'Render interrupted by server restart' : timedOut ? 'Render exceeded the 30-minute limit' : 'Render failed. Retry or review this video.'} Reference: ${row.id}`);
    await fs.rm(partial, {force: true});
    await fs.rm(output, {force: true});
  } finally {
    clearInterval(timer); clearTimeout(deadline); cancelCurrent = undefined;
  }
}
server.close();
process.exit(0);
