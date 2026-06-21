import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {projectRoot, syncCurrentFootballJobDuration} from './lib/video-system.mjs';

const job = await syncCurrentFootballJobDuration();

await fs.mkdir(path.join(projectRoot, 'out'), {recursive: true});

const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const outputPath = path.join('out', job.outputName);

const child = spawn(npxCommand, ['remotion', 'render', 'src/index.ts', job.compositionId, outputPath], {
  cwd: projectRoot,
  env: process.env,
  stdio: 'inherit',
});

child.on('close', (code) => {
  process.exit(code ?? 1);
});
