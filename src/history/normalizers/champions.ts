import {getHistoricalClubByName} from '../clubResolver.js';
import type {
  CompetitionHistory,
  HistoricalChampion,
  HistoryWarning,
  RawCompetitionHistory,
  RawHistoricalChampion,
} from '../types/index.js';
import {isRecord} from '../utils/json.js';
import {normalizeKey, toOptionalString, trimExtraSpaces} from '../utils/text.js';

const toYear = (value: unknown) => {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const year = Number.parseInt(value.trim(), 10);
    return Number.isInteger(year) ? year : undefined;
  }

  return undefined;
};

const toRawChampion = (value: unknown): RawHistoricalChampion | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    year: value.year,
    champion: value.champion,
    clubName: value.clubName,
    country: value.country,
    runnerUp: value.runnerUp,
    score: value.score,
    notes: value.notes,
  };
};

const getRawChampions = (payload: unknown) => {
  if (Array.isArray(payload)) {
    return payload.map(toRawChampion).filter((item): item is RawHistoricalChampion => Boolean(item));
  }

  if (!isRecord(payload) || !Array.isArray(payload.champions)) {
    return [];
  }

  return payload.champions
    .map(toRawChampion)
    .filter((item): item is RawHistoricalChampion => Boolean(item));
};

const normalizeChampionName = (raw: RawHistoricalChampion) =>
  toOptionalString(raw.clubName) ?? toOptionalString(raw.champion);

const sortChronologically = (champions: HistoricalChampion[]) =>
  [...champions].sort((left, right) => left.year - right.year || left.clubName.localeCompare(right.clubName));

export const normalizeCompetitionHistory = async ({
  payload,
  competitionId,
  competitionName,
  amount,
}: {
  payload: unknown;
  competitionId: string;
  competitionName: string;
  amount: number;
}): Promise<CompetitionHistory> => {
  const warnings: HistoryWarning[] = [];
  const champions: HistoricalChampion[] = [];
  const seen = new Set<string>();

  for (const raw of getRawChampions(payload)) {
    const year = toYear(raw.year);
    const championName = normalizeChampionName(raw);
    const country = toOptionalString(raw.country);

    if (!year || !championName || !country) {
      warnings.push({
        code: 'invalid-record',
        message: 'Historical champion record skipped because year, champion, or country is missing.',
      });
      continue;
    }

    const dedupeKey = `${year}:${normalizeKey(championName)}`;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);

    const club = await getHistoricalClubByName(championName);
    if (!club.found) {
      warnings.push({
        code: 'club-not-found',
        message: `Club "${championName}" was not found in aliases, logos, or accent colors.`,
        context: {clubName: championName, year},
      });
    }

    champions.push({
      year,
      clubId: club.club?.clubId ?? normalizeKey(championName).replace(/\s+/g, '-'),
      clubName: club.club?.clubName ?? trimExtraSpaces(championName),
      country,
      ...(toOptionalString(raw.runnerUp) ? {runnerUp: toOptionalString(raw.runnerUp)} : {}),
      ...(toOptionalString(raw.score) ? {score: toOptionalString(raw.score)} : {}),
      ...(toOptionalString(raw.notes) ? {notes: toOptionalString(raw.notes)} : {}),
      ...(club.club?.badge ? {badge: club.club.badge} : {}),
    });
  }

  const sorted = sortChronologically(champions).slice(-amount);
  return {
    competitionId,
    competitionName,
    champions: sorted,
    ...(warnings.length > 0 ? {warnings} : {}),
  };
};

export const normalizeRawCompetitionPayload = (payload: unknown): RawCompetitionHistory => {
  if (!isRecord(payload)) {
    return {};
  }

  return {
    competitionId: payload.competitionId,
    competitionName: payload.competitionName,
    champions: payload.champions,
  };
};
