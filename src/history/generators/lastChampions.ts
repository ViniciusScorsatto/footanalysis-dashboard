import {readHistoryCache, writeHistoryCache} from '../cache/historyCache.js';
import {readLocalHistory} from '../datasource/localJson.js';
import {generateHistoricalChampions} from '../datasource/openAiHistory.js';
import type {CompetitionHistory, HistoryGeneratorOptions} from '../types/index.js';
import {normalizeCompetitionHistory} from '../normalizers/champions.js';

const generatorId = 'last-champions';

const fetchFromOpenAiAndCache = async (options: HistoryGeneratorOptions) => {
  const payload = await generateHistoricalChampions(options.competitionName, options.amount);
  await writeHistoryCache(options.competitionId, generatorId, {
    competitionId: options.competitionId,
    competitionName: options.competitionName,
    champions: payload.champions,
  });
  return payload;
};

export const generateLastChampionsHistory = async (
  options: HistoryGeneratorOptions
): Promise<CompetitionHistory> => {
  const localPayload =
    options.sourceMode === 'openai-refresh'
      ? undefined
      : await readLocalHistory(options.competitionId, generatorId);
  const cachePayload =
    options.sourceMode !== 'openai-refresh' && !localPayload
      ? await readHistoryCache(options.competitionId, generatorId)
      : undefined;

  if (options.sourceMode === 'local-only' && !localPayload && !cachePayload) {
    throw new Error(
      `No local or cached history JSON found for ${options.competitionId}/${generatorId}.`
    );
  }

  const payload =
    localPayload ??
    cachePayload ??
    (options.sourceMode === 'local-only' ? undefined : await fetchFromOpenAiAndCache(options));

  if (!payload) {
    throw new Error(`No historical data available for ${options.competitionId}/${generatorId}.`);
  }

  const normalized = await normalizeCompetitionHistory({
    payload,
    competitionId: options.competitionId,
    competitionName: options.competitionName,
    amount: options.amount,
  });

  if (!localPayload && options.sourceMode !== 'local-only') {
    await writeHistoryCache(options.competitionId, generatorId, normalized);
  }

  return normalized;
};
