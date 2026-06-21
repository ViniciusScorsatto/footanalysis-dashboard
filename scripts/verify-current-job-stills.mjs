import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {
  projectRoot,
  syncCurrentFootballJobDuration,
} from './lib/video-system.mjs';
import {visiblePixelRatio} from './lib/png-visibility.mjs';

const execFileAsync = promisify(execFile);
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const outputDir = path.join(projectRoot, 'out', 'validation', 'current-job');

const clampFrame = (frame, durationInFrames) =>
  Math.max(0, Math.min(Math.round(frame), Math.max(0, durationInFrames - 1)));

const getValidationFrames = (job) => {
  const durationInFrames = Number(job.durationInFrames);
  const safeDuration = Number.isFinite(durationInFrames) && durationInFrames > 0
    ? Math.round(durationInFrames)
    : 360;

  return [
    {label: 'opening', frame: clampFrame(30, safeDuration)},
    {label: 'payload', frame: clampFrame(Math.floor(safeDuration * 0.45), safeDuration)},
    {label: 'cta-final', frame: clampFrame(safeDuration - 1, safeDuration)},
  ];
};

const renderStill = async ({compositionId, frame, outputPath}) => {
  await execFileAsync(
    npxCommand,
    ['remotion', 'still', 'src/index.ts', compositionId, outputPath, `--frame=${frame}`],
    {cwd: projectRoot}
  );
};

const main = async () => {
  const job = await syncCurrentFootballJobDuration();

  if (!job?.compositionId) {
    throw new Error('Current football job is missing compositionId.');
  }

  await fs.mkdir(outputDir, {recursive: true});

  const failures = [];
  const frames = getValidationFrames(job);

  for (const item of frames) {
    const outputPath = path.join(
      outputDir,
      `${job.compositionId}-${item.label}-frame-${item.frame}.png`
    );

    await renderStill({
      compositionId: job.compositionId,
      frame: item.frame,
      outputPath,
    });

    const ratio = await visiblePixelRatio(outputPath);
    const pct = (ratio * 100).toFixed(2);
    console.log(`${item.label}: frame ${item.frame}, visible pixels ${pct}% (${outputPath})`);

    if (ratio < 0.01) {
      failures.push(`${item.label} frame looks blank (${pct}% visible pixels): ${outputPath}`);
    }
  }

  if (failures.length) {
    throw new Error(`Current job still validation failed:\n${failures.join('\n')}`);
  }

  console.log(`Validated ${frames.length} stills for ${job.compositionId} in ${outputDir}`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
