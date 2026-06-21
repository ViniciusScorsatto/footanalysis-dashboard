import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import zlib from 'node:zlib';
import {projectRoot} from './lib/video-system.mjs';

const execFileAsync = promisify(execFile);
const inflateAsync = promisify(zlib.inflate);

const configPath = path.join(projectRoot, 'config', 'football-short-durations.json');
const outputDir = path.join('/tmp', 'foot-analysis-short-endframes');
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'));

const positiveFrameCount = (value, fallback) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;

const paeth = (left, above, upperLeft) => {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);

  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
  if (aboveDistance <= upperLeftDistance) return above;
  return upperLeft;
};

const parsePng = async (filePath) => {
  const png = await fs.readFile(filePath);
  const signature = png.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') {
    throw new Error(`${filePath} is not a PNG file.`);
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idatChunks = [];

  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.subarray(offset + 4, offset + 8).toString('ascii');
    const data = png.subarray(offset + 8, offset + 8 + length);
    offset += length + 12;

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const bitDepth = data[8];
      colorType = data[9];
      if (bitDepth !== 8 || ![2, 6].includes(colorType)) {
        throw new Error(`${filePath} uses unsupported PNG format bitDepth=${bitDepth} colorType=${colorType}.`);
      }
    }

    if (type === 'IDAT') idatChunks.push(data);
    if (type === 'IEND') break;
  }

  const channels = colorType === 6 ? 4 : 3;
  const bytesPerPixel = channels;
  const stride = width * channels;
  const inflated = await inflateAsync(Buffer.concat(idatChunks));
  const pixels = Buffer.alloc(width * height * channels);

  let inputOffset = 0;
  for (let y = 0; y < height; y++) {
    const filter = inflated[inputOffset++];
    const rowStart = y * stride;
    const previousRowStart = (y - 1) * stride;

    for (let x = 0; x < stride; x++) {
      const raw = inflated[inputOffset++];
      const left = x >= bytesPerPixel ? pixels[rowStart + x - bytesPerPixel] : 0;
      const above = y > 0 ? pixels[previousRowStart + x] : 0;
      const upperLeft = y > 0 && x >= bytesPerPixel ? pixels[previousRowStart + x - bytesPerPixel] : 0;
      const predictor =
        filter === 0
          ? 0
          : filter === 1
            ? left
            : filter === 2
              ? above
              : filter === 3
                ? Math.floor((left + above) / 2)
                : filter === 4
                  ? paeth(left, above, upperLeft)
                  : 0;
      pixels[rowStart + x] = (raw + predictor) & 0xff;
    }
  }

  return {width, height, channels, pixels};
};

const visiblePixelRatio = async (filePath) => {
  const {width, height, channels, pixels} = await parsePng(filePath);
  let visiblePixels = 0;
  const totalPixels = width * height;

  for (let index = 0; index < pixels.length; index += channels) {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const alpha = channels === 4 ? pixels[index + 3] : 255;
    const luma = red * 0.2126 + green * 0.7152 + blue * 0.0722;

    if (alpha > 8 && luma > 18) {
      visiblePixels++;
    }
  }

  return visiblePixels / totalPixels;
};

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
