import fs from 'node:fs/promises';
import path from 'node:path';
import {
  publicLogosDir,
  teamAccentColorsFile,
  teamLogoOverridesFile,
  teamNameAliasesFile,
} from './paths.js';
import type {HistoricalClub} from './types/index.js';
import {isRecord, readJsonFile} from './utils/json.js';
import {normalizeKey, shortClubLabel, slugify, trimExtraSpaces} from './utils/text.js';

type AliasConfig = {
  global: Record<string, string>;
  leagues: Record<string, Record<string, string>>;
};

type LogoOverrides = {
  global: Record<string, string>;
  teamsById: Record<string, string>;
  leagues: Record<string, {names: Record<string, string>; teamsById: Record<string, string>}>;
};

type AccentConfig = {
  global: Record<string, string>;
  leagues: Record<string, Record<string, string>>;
};

type HistoricalClubResult = {
  club?: HistoricalClub;
  found: boolean;
};

const isHexColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value.trim());

const normalizePublicPath = (value: unknown) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  return normalized.startsWith('/') ? normalized : `/${normalized}`;
};

const objectToStringRecord = (value: unknown) => {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
      .map(([key, item]) => [normalizeKey(key), trimExtraSpaces(item)])
  );
};

const objectToPathRecord = (value: unknown) => {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [normalizeKey(key), normalizePublicPath(item)])
      .filter((entry): entry is [string, string] => Boolean(entry[0]) && Boolean(entry[1]))
  );
};

const objectToIdPathRecord = (value: unknown) => {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [String(key).trim(), normalizePublicPath(item)])
      .filter((entry): entry is [string, string] => Boolean(entry[0]) && Boolean(entry[1]))
  );
};

const objectToAccentRecord = (value: unknown) => {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, string] => isHexColor(entry[1]))
      .map(([key, item]) => [normalizeKey(key), item.trim()])
  );
};

const loadAliasConfig = async (): Promise<AliasConfig> => {
  try {
    const payload = await readJsonFile(teamNameAliasesFile);
    const leagues = isRecord(payload) && isRecord(payload.leagues) ? payload.leagues : {};
    return {
      global: isRecord(payload) ? objectToStringRecord(payload.global) : {},
      leagues: Object.fromEntries(
        Object.entries(leagues).map(([leagueId, aliases]) => [
          String(leagueId),
          objectToStringRecord(aliases),
        ])
      ),
    };
  } catch {
    return {global: {}, leagues: {}};
  }
};

const loadLogoOverrides = async (): Promise<LogoOverrides> => {
  try {
    const payload = await readJsonFile(teamLogoOverridesFile);
    const leagues = isRecord(payload) && isRecord(payload.leagues) ? payload.leagues : {};
    return {
      global: isRecord(payload) ? objectToPathRecord(payload.global) : {},
      teamsById: isRecord(payload) ? objectToIdPathRecord(payload.teamsById) : {},
      leagues: Object.fromEntries(
        Object.entries(leagues).map(([leagueId, overrides]) => {
          const structured = isRecord(overrides) && (isRecord(overrides.names) || isRecord(overrides.teamsById));
          return [
            String(leagueId),
            {
              names: objectToPathRecord(structured && isRecord(overrides) ? overrides.names : overrides),
              teamsById: objectToIdPathRecord(isRecord(overrides) ? overrides.teamsById : undefined),
            },
          ];
        })
      ),
    };
  } catch {
    return {global: {}, teamsById: {}, leagues: {}};
  }
};

const loadAccentConfig = async (): Promise<AccentConfig> => {
  try {
    const payload = await readJsonFile(teamAccentColorsFile);
    const leagues = isRecord(payload) && isRecord(payload.leagues) ? payload.leagues : {};
    return {
      global: isRecord(payload) ? objectToAccentRecord(payload.global) : {},
      leagues: Object.fromEntries(
        Object.entries(leagues).map(([leagueId, accents]) => [
          String(leagueId),
          objectToAccentRecord(accents),
        ])
      ),
    };
  } catch {
    return {global: {}, leagues: {}};
  }
};

const logoAliases: Record<string, string[]> = {
  'athletico pr': ['atletico paranaense', 'athletico paranaense'],
  'atletico pr': ['atletico paranaense', 'athletico paranaense'],
  'atletico mineiro': ['atletico mg'],
  'atletico nacional': ['atletico nacional'],
  'boca juniors': ['boca juniors', 'boca'],
  botafogo: ['botafogo'],
  flamengo: ['flamengo'],
  fluminense: ['fluminense'],
  gremio: ['gremio'],
  palmeiras: ['palmeiras'],
  'river plate': ['river plate'],
};

const findCachedLogo = async (clubName: string) => {
  const normalized = normalizeKey(clubName);
  const candidates = [
    ...(logoAliases[normalized] ?? []),
    clubName,
  ].map(slugify).filter(Boolean);

  if (candidates.length === 0) {
    return undefined;
  }

  let filenames: string[];
  try {
    filenames = await fs.readdir(publicLogosDir);
  } catch {
    return undefined;
  }

  for (const candidate of candidates) {
    const exactPng = `${candidate}.png`;
    const exactSvg = `${candidate}.svg`;
    const filename =
      filenames.find((item) => item === exactPng) ??
      filenames.find((item) => item === exactSvg) ??
      filenames.find((item) => item.startsWith(`${candidate}-`) && /\.(?:png|svg)$/i.test(item));

    if (filename) {
      return `/logos/${filename}`;
    }
  }

  return undefined;
};

const resolveDisplayName = (clubName: string, aliases: AliasConfig) => {
  const key = normalizeKey(clubName);
  return aliases.global[key] ?? clubName;
};

const resolveLogoOverride = (clubName: string, displayName: string, overrides: LogoOverrides) => {
  const keys = [clubName, displayName].map(normalizeKey).filter(Boolean);

  for (const key of keys) {
    const logoPath = overrides.global[key];
    if (logoPath) {
      return logoPath;
    }
  }

  return undefined;
};

const resolveAccentColor = (clubName: string, displayName: string, accents: AccentConfig) => {
  const keys = [clubName, displayName].map(normalizeKey).filter(Boolean);

  for (const key of keys) {
    const accentColor = accents.global[key];
    if (accentColor) {
      return accentColor;
    }
  }

  return undefined;
};

export const getHistoricalClubByName = async (name: string): Promise<HistoricalClubResult> => {
  const clubName = trimExtraSpaces(name);
  if (!clubName) {
    return {found: false};
  }

  const [aliases, logoOverrides, accentConfig] = await Promise.all([
    loadAliasConfig(),
    loadLogoOverrides(),
    loadAccentConfig(),
  ]);
  const displayName = resolveDisplayName(clubName, aliases);
  const logoPath =
    resolveLogoOverride(clubName, displayName, logoOverrides) ??
    (await findCachedLogo(displayName)) ??
    (await findCachedLogo(clubName));
  const accentColor = resolveAccentColor(clubName, displayName, accentConfig);
  const found = Boolean(logoPath || accentColor || normalizeKey(displayName) !== normalizeKey(clubName));

  return {
    found,
    club: {
      clubId: slugify(displayName),
      clubName: displayName,
      badge: {
        label: shortClubLabel(displayName),
        ...(logoPath ? {logoPath: path.posix.normalize(logoPath)} : {}),
        ...(accentColor ? {accentColor} : {}),
      },
    },
  };
};
