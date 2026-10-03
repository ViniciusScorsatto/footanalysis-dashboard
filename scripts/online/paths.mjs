import path from 'node:path';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

export const root = fileURLToPath(new URL('../../', import.meta.url));
export const online = process.env.FOOT_ANALYSIS_ONLINE === '1';
export const stateRoot = path.resolve(process.env.FOOT_ANALYSIS_DATA_DIR || path.join(root, 'data', 'online'));
export const publicRoot = online ? path.join(stateRoot, 'public') : path.join(root, 'public');
export const configRoot = online ? path.join(stateRoot, 'config') : path.join(root, 'config');
export const generatedRoot = online ? path.join(stateRoot, 'generated') : path.join(root, 'src/data/generated');
export const outputRoot = online ? path.join(stateRoot, 'renders') : path.join(root, 'out');

// Seed shipped assets only once per filename. Never replace user state on deploy.
export async function initializeState() {
  if (!online) throw new Error('Online initialization requires FOOT_ANALYSIS_ONLINE=1');
  for (const dir of [stateRoot, publicRoot, configRoot, generatedRoot, outputRoot, path.join(stateRoot, 'tmp')]) {
    await fs.mkdir(dir, {recursive: true});
  }
  await fs.cp(path.join(root, 'public'), publicRoot, {recursive: true, force: false, errorOnExist: false});
  await fs.cp(path.join(root, 'config'), configRoot, {recursive: true, force: false, errorOnExist: false});
}
