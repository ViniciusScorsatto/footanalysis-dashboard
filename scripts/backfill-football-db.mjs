import {
  saveApiSnapshot,
  saveFixturesFromApi,
  saveStandingsFromApi,
  saveTopScorersFromApi,
} from './lib/football-db.mjs';

const apiKey = process.env.FOOTBALL_API_KEY;
const apiHost = process.env.FOOTBALL_API_HOST ?? 'v3.football.api-sports.io';
const defaultLeagueIds = [39, 71];
const leagueIds = String(process.env.FOOTBALL_BACKFILL_LEAGUE_IDS ?? '')
  .split(',')
  .map((item) => Number(item.trim()))
  .filter(Number.isFinite);
const season = Number(process.env.FOOTBALL_BACKFILL_SEASON ?? process.env.FOOTBALL_SEASON ?? '2026');
const targetLeagueIds = leagueIds.length ? leagueIds : defaultLeagueIds;

if (!apiKey) {
  throw new Error('Missing FOOTBALL_API_KEY. Add it to .env before running the football DB backfill.');
}

const fetchApi = async (endpoint, params) => {
  const url = new URL(`https://${apiHost}/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    headers: {
      'x-apisports-key': apiKey,
      'x-apisports-host': apiHost,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${endpoint} failed with ${response.status}: ${JSON.stringify(payload)}`);
  }

  saveApiSnapshot({endpoint, params, payload});
  return payload;
};

for (const leagueId of targetLeagueIds) {
  console.log(`Backfilling league ${leagueId} season ${season}...`);
  const fixtures = await fetchApi('fixtures', {league: leagueId, season});
  saveFixturesFromApi({leagueId, season, fixtures: fixtures.response ?? []});

  const standings = await fetchApi('standings', {league: leagueId, season});
  saveStandingsFromApi({leagueId, season, payload: standings});

  const topScorers = await fetchApi('players/topscorers', {league: leagueId, season});
  saveTopScorersFromApi({leagueId, season, payload: topScorers});
}

console.log(`Backfill complete for leagues: ${targetLeagueIds.join(', ')}`);
