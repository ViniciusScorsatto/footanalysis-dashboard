// Offline fixture verification. Never reads API keys, local jobs or production data.
import {build} from 'esbuild';
import {renderStill, renderMedia, selectComposition} from '@remotion/renderer';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {root} from './paths.mjs';
const built = await build({entryPoints:[path.join(root,'tests/online-fixtures.ts')],bundle:true,write:false,platform:'node',format:'esm'});
const {jobs,nations} = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);
const dir = await fs.mkdtemp(path.join(os.tmpdir(),'foot-online-verify-'));
const serveUrl = path.join(root,'build/online/render');
const report = [];
for (const source of jobs) {
  for (const channelProfile of ['pt','en']) {
    for (const videoMode of ['animated','static']) {
      const job = {...source,channelProfile,languageProfile:channelProfile==='pt'?'pt-br':'en',videoMode};
      const inputProps = {job};
      const composition = await selectComposition({serveUrl,id:'OnlineShort',inputProps});
      const name = `${source===nations?'nations':job.template}-${channelProfile}-${videoMode}`;
      await renderStill({serveUrl,composition,inputProps,frame:Math.min(200,composition.durationInFrames-1),output:path.join(dir,`${name}.png`),scale:0.3});
      report.push({name,frames:composition.durationInFrames});
      console.log(name,'OK');
    }
  }
}
if (process.argv.includes('--video')) {
  const inputProps = {job:nations};
  const composition = await selectComposition({serveUrl,id:'OnlineShort',inputProps});
  const start = Date.now();
  await renderMedia({serveUrl,composition,inputProps,outputLocation:path.join(dir,'nations.mp4'),codec:'h264',audioCodec:'aac',pixelFormat:'yuv420p',concurrency:1});
  report.push({benchmark:'nations',elapsedMs:Date.now()-start,frames:composition.durationInFrames});
}
await fs.writeFile(path.join(dir,'report.json'),JSON.stringify(report,null,2));
console.log('Verification artifacts:',dir);
