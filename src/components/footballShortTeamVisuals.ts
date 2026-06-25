import type {FixtureCard, TeamBadge} from '../lib/types';
import type {FootballShortTeaserVariant} from './FootballShortTeaserKit';

const MAJOR_TEAM_PRIORITY: Record<string, number> = {
  flamengo: 100,
  palmeiras: 98,
  corinthians: 96,
  'sao paulo': 94,
  santos: 92,
  vasco: 90,
  botafogo: 88,
  gremio: 86,
  internacional: 84,
  cruzeiro: 82,
  'atletico mg': 80,
  fluminense: 78,
  bahia: 74,
  fortaleza: 72,
  sport: 70,
  vitoria: 68,
  ceara: 66,
  brazil: 64,
  brasil: 64,
  argentina: 63,
  france: 62,
  franca: 62,
  germany: 61,
  alemanha: 61,
  spain: 60,
  espanha: 60,
  portugal: 59,
  england: 58,
  inglaterra: 58,
  italy: 57,
  italia: 57,
  netherlands: 56,
  holanda: 56,
  uruguay: 55,
  uruguai: 55,
  belgium: 54,
  belgica: 54,
};

const TEAM_ACCENT_COLORS: Record<string, string> = {
  palmeiras: '#27AE60',
  flamengo: '#E3222A',
  sport: '#C8102E',
  crb: '#E30613',
  nautico: '#D71920',
  goias: '#009B3A',
  ceara: '#111111',
  'botafogo sp': '#E3222A',
  botafogo: '#f0f4f8',
  cruzeiro: '#1E5AA8',
  gremio: '#00AEEF',
  internacional: '#E30613',
  corinthians: '#f0f4f8',
  santos: '#f0f4f8',
  'sao paulo': '#D71920',
  vasco: '#f0f4f8',
  bahia: '#1E5AA8',
  'atletico mg': '#f0f4f8',
  fluminense: '#7F1734',
  vitoria: '#E3222A',
  fortaleza: '#0057B8',
};

export const normalizeTeamKey = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(fc|sc|ec|afc|club|futebol clube|esporte clube|da gama)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const teamAccentColor = (
  team: string,
  badge: TeamBadge | undefined,
  fallback: string,
) => badge?.accentColor ?? TEAM_ACCENT_COLORS[normalizeTeamKey(team)] ?? fallback;

const hasFixtureScore = (fixture: FixtureCard) =>
  fixture.homeScore !== null &&
  fixture.awayScore !== null &&
  fixture.homeScore !== undefined &&
  fixture.awayScore !== undefined;

const teamPriority = (team: string) => MAJOR_TEAM_PRIORITY[normalizeTeamKey(team)] ?? 0;

const fixtureTeamPriority = (fixture: FixtureCard) =>
  Math.max(teamPriority(fixture.homeTeam), teamPriority(fixture.awayTeam));

const fixtureResultScore = (fixture: FixtureCard) => {
  const margin =
    fixture.homeScore === null || fixture.awayScore === null
      ? 0
      : Math.abs(fixture.homeScore - fixture.awayScore);
  const totalGoals =
    fixture.homeScore === null || fixture.awayScore === null
      ? 0
      : fixture.homeScore + fixture.awayScore;

  return margin * 100 + totalGoals * 8 + fixtureTeamPriority(fixture);
};

export const orderFixtureTeaserItems = (
  fixtures: FixtureCard[],
  variant?: FootballShortTeaserVariant,
) => {
  const sorted = fixtures
    .map((fixture, index) => ({
      fixture,
      index,
      priority:
        variant === 'results'
          ? fixtureResultScore(fixture)
          : fixtureTeamPriority(fixture) * 100 + (hasFixtureScore(fixture) ? 12 : 0),
    }))
    .sort((left, right) => right.priority - left.priority || left.index - right.index);

  return sorted.map((item) => item.fixture);
};
