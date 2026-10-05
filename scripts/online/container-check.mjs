// Host-side CI integration test. Uses only freshly created Docker resources
// and synthetic credentials, never the local or Railway data directory.
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
const [image, validationImage] = process.argv.slice(2);
if (!image || !validationImage) throw new Error('Pass production and validation image tags');
const name = `foot-container-check-${randomUUID()}`;
const volume = `${name}-data`;
async function docker(args, {input, allowFailure = false} = {}) {
  const child = spawn('docker', args, {stdio: ['pipe', 'pipe', 'pipe']});
  let output = '';
  child.stdout.on('data', chunk => {output += chunk;});
  child.stderr.on('data', chunk => {output += chunk;});
  child.stdin.end(input);
  const code = await new Promise((resolve, reject) => {child.on('error', reject); child.on('close', resolve);});
  if (code && !allowFailure) throw new Error(`Docker check failed (${code}): ${output}`);
  return output;
}
const flags = ['--read-only', '--tmpfs', '/tmp:rw,nosuid,nodev,size=512m',
  '--cap-drop', 'ALL', '--cap-add', 'CHOWN', '--cap-add', 'SETUID', '--cap-add', 'SETGID', '--cap-add', 'DAC_OVERRIDE',
  '--security-opt', 'no-new-privileges=true', '--pids-limit', '256'];
const env = ['-e','PUBLIC_URL=https://validation.invalid','-e','GOOGLE_CLIENT_ID=validation',
  '-e','GOOGLE_CLIENT_SECRET=validation-only','-e','ALLOWED_EMAIL=owner@example.com','-e','PORT=8080',
  '-e','FOOTBALL_API_KEY=synthetic-private','-e','UNRELATED_SECRET=synthetic-private'];
const waitReady = async () => {
  for (let i = 0; i < 60; i++) {
    try {
      await docker(['exec', name, 'node', '-e',
        'fetch("http://127.0.0.1:8080/healthz").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))']);
      const logs = await docker(['logs', name]);
      if (logs.includes('worker_ready')) return;
    } catch { /* Startup is not ready yet. */ }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Container did not become healthy: ' + await docker(['logs', name]));
};
try {
  console.log(await docker(['run','--rm','-i','--network','none',image,'node','--input-type=module'], {input: `
    import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {spawnSync} from 'node:child_process';import {createRequire} from 'node:module';
    const require=createRequire('/app/package.json');
    for(const command of ['python3','gcc','g++','make','npm','npx','yarn']) assert.equal(spawnSync(command,['--version']).error?.code,'ENOENT',command);
    for(const pkg of ['esbuild','typescript','@remotion/cli','@remotion/bundler','@remotion/player']) assert.throws(()=>require.resolve(pkg));
    for(const pkg of ['@remotion/renderer','better-sqlite3']) assert.ok(require.resolve(pkg));
    for(const file of ['/app/tests','/app/.git','/app/.env','/app/src/data/generated']) await assert.rejects(fs.access(file));
    console.log('PASS: production has runtime dependencies only, no compilers, tests, Git or local data');
  `}));
  console.log(await docker(['run','--rm','--network','none','--read-only',
    '--tmpfs','/tmp:rw,nosuid,nodev,size=128m','--user','1000:1000',
    '--cap-drop','ALL','--security-opt','no-new-privileges=true',validationImage,
    'sh','-c','node --test tests/online-*.test.mjs']));
  await docker(['run','-d','--name',name,...flags,'--mount',`type=volume,source=${volume},target=/data`,...env,validationImage]);
  await waitReady();
  console.log(await docker(['exec','-i','--user','1000:1000',name,'node','--input-type=module'], {input: `
    import fs from 'node:fs/promises';import assert from 'node:assert/strict';
    let found=false;
    for(const pid of await fs.readdir('/proc')) {
      if(!/^\\d+$/.test(pid)) continue;
      let cmd;try{cmd=await fs.readFile('/proc/'+pid+'/cmdline','utf8');}catch{continue;}
      if(!cmd.split('\\0').some(arg=>arg.endsWith('scripts/online/worker.mjs'))) continue;
      const env=(await fs.readFile('/proc/'+pid+'/environ','utf8')).split('\\0');
      assert.ok(env.includes('FOOT_ANALYSIS_ONLINE=1'));
      for(const key of ['GOOGLE_CLIENT_SECRET','GOOGLE_CLIENT_ID','ALLOWED_EMAIL','FOOTBALL_API_KEY','UNRELATED_SECRET','PUBLIC_URL','NODE_OPTIONS']) assert.ok(!env.some(v=>v.startsWith(key+'=')),key);
      const status=await fs.readFile('/proc/'+pid+'/status','utf8');
      assert.match(status,/^Uid:\\s+1000\\s+1000\\s+1000\\s+1000$/m);
      assert.match(status,/^NoNewPrivs:\\s+1$/m);assert.match(status,/^CapEff:\\s+0+$/m);found=true;
    }
    assert.ok(found);console.log('PASS: worker environment has no server secrets; UID1000, no-new-privileges, zero effective capabilities');
  `}));
  console.log(await docker(['exec','--user','1000:1000',name,'node','tests/online-container.mjs']));
  await docker(['restart',name]);
  await waitReady();
  console.log(await docker(['exec','--user','1000:1000',name,'node','--input-type=module','-e',
    `import fs from 'node:fs/promises';import assert from 'node:assert/strict';const {ids}=JSON.parse(await fs.readFile('/data/validation.json'));for(const id of ids)await fs.access('/data/renders/'+id+'.mp4');assert.equal(await fs.readFile('/data/config/validation-preserved.txt','utf8'),'preserved');console.log('PASS: read-only root and persistent data survive restart');`]));
} finally {
  await docker(['rm','-f',name], {allowFailure:true});
  await docker(['volume','rm',volume], {allowFailure:true});
}
