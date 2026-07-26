import path from 'node:path';
import {historyDataDir} from '../paths.js';
import {readJsonFile} from '../utils/json.js';

export const getLocalHistoryPath = (competitionId: string, generatorId: string) =>
  path.join(historyDataDir, competitionId, `${generatorId}.json`);

export const readLocalHistory = async (competitionId: string, generatorId: string) => {
  try {
    return await readJsonFile(getLocalHistoryPath(competitionId, generatorId));
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return undefined;
    }

    throw error;
  }
};
