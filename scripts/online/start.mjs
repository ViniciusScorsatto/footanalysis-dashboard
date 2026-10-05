import {spawn} from 'node:child_process';
import {logEvent} from './logging.mjs';
import {dropContainerPrivileges} from './privileges.mjs';
await dropContainerPrivileges();
process.env.FOOT_ANALYSIS_ONLINE = '1';
const {initializeState, root} = await import('./paths.mjs');
await initializeState();
// Fail before starting a public listener if credentials are missing.
const {createOnlineHttp} = await import('./http.mjs');
createOnlineHttp();
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  const deadline = setTimeout(() => {for (const child of children) child.kill('SIGKILL');process.exit(code);}, 10000);
  Promise.all(children.map((child) => child.exitCode !== null ? Promise.resolve() : new Promise((resolve) => child.once('exit',resolve)))).then(() => {clearTimeout(deadline);process.exit(code);});
}
for (const entry of ['scripts/dashboard-server.mjs','scripts/online/worker.mjs']) {
  const child = spawn(process.execPath,[entry],{cwd:root,env:process.env,stdio:'inherit'});
  children.push(child);
  child.on('error',(error) => {logEvent('process_failed', {entry, error}, 'error');stop(1);});
  child.on('exit',(code, signal) => {logEvent('process_exited', {entry, code, signal, stopping}, !stopping ? 'error' : 'info');if(!stopping) stop(code || 1);});
}
process.on('SIGTERM',()=>stop());
process.on('SIGINT',()=>stop());
