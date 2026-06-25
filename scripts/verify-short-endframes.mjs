import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {projectRoot} from './lib/video-system.mjs';
import {visiblePixelRatio} from './lib/png-visibility.mjs';

const execFileAsync = promisify(execFile);

const configPath = path.join(projectRoot, 'config', 'football-short-durations.json');
const outputDir = path.join('/tmp', 'foot-analysis-short-endframes');
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'));

const positiveFrameCount = (value, fallback) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;

const main = async () => {
  const config = await readJson(configPath);
  const teaserFrames = positiveFrameCount(config.opening?.teaserFrames, 60);
  const introFrames = positiveFrameCount(config.opening?.introFrames, 45);
  const defaultContentFrames = positiveFrameCount(config.defaultContentFrames, 345);
  const minimumTotalFrames = positiveFrameCount(config.minimumTotalFrames, 360);
  const openingFrames = teaserFrames + introFrames;
  const compositions = Object.entries(config.contentFramesByComposition ?? {});

  await fs.mkdir(outputDir, {recursive: true});

  const failures = [];
  for (const [compositionId, configuredContentFrames] of compositions) {
    const contentFrames = positiveFrameCount(configuredContentFrames, defaultContentFrames);
    const durationInFrames = Math.max(minimumTotalFrames, openingFrames + contentFrames);
    const finalFrame = durationInFrames - 1;
    const outputPath = path.join(outputDir, `${compositionId}-frame-${finalFrame}.png`);

    await execFileAsync(npxCommand, [
      'remotion',
      'still',
      'src/index.ts',
      compositionId,
      outputPath,
      `--frame=${finalFrame}`,
    ], {cwd: projectRoot});

    const ratio = await visiblePixelRatio(outputPath);
    const pct = (ratio * 100).toFixed(2);
    console.log(`${compositionId}: frame ${finalFrame}, visible pixels ${pct}%`);

    if (ratio < 0.01) {
      failures.push(`${compositionId} final frame looks blank (${pct}% visible pixels): ${outputPath}`);
    }
  }

  if (failures.length) {
    throw new Error(`Short end-frame verification failed:\n${failures.join('\n')}`);
  }

  console.log(`Verified ${compositions.length} Short final frames in ${outputDir}`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
