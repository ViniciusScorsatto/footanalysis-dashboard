import {getSeasonFixtures, getRoundFixtures, saveFootballStories} from './football-db.mjs';
import {detectStories, selectStories} from './story-detector.mjs';

const FINISHED = new Set(['FT', 'AET', 'PEN']);
const roundNumber = (round) => {
  const matches = String(round ?? '').match(/(\d+)/g);
  return matches?.length ? Number(matches.at(-1)) : Number.MAX_SAFE_INTEGER;
};
const isFinished = (fixture) => FINISHED.has(fixture.statusShort) || (Number.isFinite(Number(fixture.homeScore)) && Number.isFinite(Number(fixture.awayScore)));
const teamKey = (id, name) => String(id ?? name);

export const buildStandings = (fixtures) => {
  const table = new Map();
  const ensure = (id, name) => {
    const key = teamKey(id, name);
    if (!table.has(key)) table.set(key, {teamId: id, team: name, played: 0, points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0});
    return table.get(key);
  };
  for (const fixture of fixtures.filter(isFinished)) {
    const home = ensure(fixture.homeTeamId, fixture.homeTeam); const away = ensure(fixture.awayTeamId, fixture.awayTeam);
    const hs = Number(fixture.homeScore); const as = Number(fixture.awayScore);
    home.played += 1; away.played += 1; home.goalsFor += hs; home.goalsAgainst += as; away.goalsFor += as; away.goalsAgainst += hs;
    home.goalDifference = home.goalsFor - home.goalsAgainst; away.goalDifference = away.goalsFor - away.goalsAgainst;
    if (hs > as) home.points += 3; else if (as > hs) away.points += 3; else { home.points += 1; away.points += 1; }
  }
  return [...table.values()].sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor || a.team.localeCompare(b.team)).map((row, index) => ({...row, rank: index + 1}));
};

export const buildRoundAnalysisInput = ({leagueId, season, round, competitionName = 'Brasileirão Série A'} = {}) => {
  const seasonFixtures = getSeasonFixtures({leagueId, season});
  const target = getRoundFixtures({leagueId, season, round});
  if (!target.length) throw new Error(`Nenhuma partida encontrada para a rodada "${round}".`);
  const targetNumber = roundNumber(round);
  const previousMatches = seasonFixtures.filter((fixture) => roundNumber(fixture.round) < targetNumber && isFinished(fixture));
  const standingsBefore = buildStandings(previousMatches);
  const standingsAfter = buildStandings([...previousMatches, ...target]);
  return {competition: {id: Number(leagueId), name: competitionName}, season: Number(season), round, matches: target, previousMatches, standingsBefore, standingsAfter};
};

export const analyzeRound = ({leagueId, season, round, competitionName = 'Brasileirão Série A', rules} = {}) => {
  const input = buildRoundAnalysisInput({leagueId, season, round, competitionName});
  const detected = detectStories(input, rules);
  const selection = selectStories(detected, rules);
  const stories = selection.all.map((story) => ({...story,
    id: `${leagueId}:${season}:${round}:${story.fingerprint}`,
  }));
  const persisted = saveFootballStories({competitionId: leagueId, competitionName, season, round, stories});
  return {competition: input.competition, season, round, partidasAnalisadas: input.matches.length, detectadas: detected.length, selecionadas: selection.selected.length, descartadas: selection.rejected.length, stories: persisted};
};
