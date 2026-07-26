import fs from 'node:fs/promises';
import path from 'node:path';
import {historyCacheDir} from '../paths.js';
import {readJsonFile, writeJsonFile} from '../utils/json.js';

export const getHistoryCachePath = (competitionId: string, generatorId: string) =>
  path.join(historyCacheDir, competitionId, `${generatorId}.json`);

export const readHistoryCache = async (competitionId: string, generatorId: string) => {
  try {
    return await readJsonFile(getHistoryCachePath(competitionId, generatorId));
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return undefined;
    }

    throw error;
  }
};

export const writeHistoryCache = async (
  competitionId: string,
  generatorId: string,
  payload: unknown
) => {
  const filePath = getHistoryCachePath(competitionId, generatorId);
  await fs.mkdir(path.dirname(filePath), {recursive: true});
  await writeJsonFile(filePath, payload);
};
