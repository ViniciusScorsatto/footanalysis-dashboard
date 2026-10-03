import path from 'node:path';
import fs from 'node:fs/promises';
import {build} from 'esbuild';
import {bundle} from '@remotion/bundler';
import {root} from './paths.mjs';

await fs.mkdir(path.join(root, 'build/online'), {recursive: true});
await build({entryPoints: [path.join(root, 'src/online/player.tsx')], bundle: true, outfile: path.join(root, 'build/online/player.js'), platform: 'browser', format: 'iife', jsx: 'automatic', minify: true, define: {'process.env.NODE_ENV': '"production"'}});
await bundle({entryPoint: path.join(root, 'src/online/render-entry.tsx'), outDir: path.join(root, 'build/online/render'), publicDir: path.join(root, 'public')});
console.log('Built online Player and immutable renderer bundle.');
