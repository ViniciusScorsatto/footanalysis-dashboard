import test from 'node:test';
import assert from 'node:assert/strict';
import {detectBlowouts, detectLeadershipChanges, detectStreaks, detectStories, detectTableZoneChanges, selectStories, STORY_TYPES} from '../scripts/lib/story-detector.mjs';

const table = (rows) => rows.map(([teamId, team, rank, points]) => ({teamId, team, rank, points}));

test('detecta mudança de liderança', () => {
  const stories = detectLeadershipChanges({standingsBefore: table([[1, 'Palmeiras', 1, 20], [2, 'Flamengo', 2, 19]]), standingsAfter: table([[2, 'Flamengo', 1, 22], [1, 'Palmeiras', 2, 20]])});
  assert.equal(stories[0].tipo, STORY_TYPES.LEADERSHIP_CHANGE);
  assert.equal(stories[0].pontuacao, 96);
});

test('não cria história quando o líder permanece líder', () => {
  assert.equal(detectLeadershipChanges({standingsBefore: table([[1, 'Palmeiras', 1, 20]]), standingsAfter: table([[1, 'Palmeiras', 1, 23]])}).length, 0);
});

test('detecta entrada e saída do Z4', () => {
  const stories = detectTableZoneChanges({
    standingsBefore: table([[1, 'A', 16, 10], [2, 'B', 17, 9]]),
    standingsAfter: table([[1, 'A', 17, 10], [2, 'B', 16, 12]]),
  });
  assert.equal(stories.length, 2);
  assert.ok(stories.some((story) => story.titulo.includes('ENTRA NO Z4')));
  assert.ok(stories.some((story) => story.titulo.includes('SAI DO Z4')));
});

test('detecta goleada com regra configurável', () => {
  const stories = detectBlowouts({matches: [{fixtureId: 10, homeTeam: 'Flamengo', awayTeam: 'Santos', homeScore: 5, awayScore: 0}]});
  assert.equal(stories[0].tipo, STORY_TYPES.BLOWOUT);
  assert.match(stories[0].justificativa, /diferença/);
});

test('detecta sequência de vitórias e sem vencer', () => {
  const matches = [1, 2, 3].map((_, index) => ({fixtureId: index, homeTeamId: 1, homeTeam: 'Bahia', awayTeamId: index + 2, awayTeam: `Time ${index}`, homeScore: 1, awayScore: 0}));
  const stories = detectStreaks({matches, previousMatches: []});
  assert.ok(stories.some((story) => story.tipo === STORY_TYPES.WINNING_STREAK));
});

test('deduplica narrativas do mesmo acontecimento', () => {
  const stories = [
    {id: 'a', fingerprint: 'a', tipo: STORY_TYPES.LEADERSHIP_CHANGE, pontuacao: 96, times: ['Flamengo', 'Palmeiras'], status: 'DETECTADA', historiasRelacionadas: []},
    {id: 'b', fingerprint: 'b', tipo: STORY_TYPES.LEADERSHIP_CHANGE, pontuacao: 90, times: ['Flamengo'], status: 'DETECTADA', historiasRelacionadas: []},
  ];
  const result = selectStories(stories);
  assert.equal(result.selected.length, 1);
  assert.equal(result.rejected[0].status, 'REJEITADA');
});

test('descarta história abaixo do limiar', () => {
  const result = selectStories([{id: 'weak', tipo: 'X', pontuacao: 20, times: [], historiasRelacionadas: []}]);
  assert.equal(result.selected.length, 0);
  assert.equal(result.rejected.length, 1);
});

test('não inventa domínio estatístico com dados incompletos e mantém pontuação válida', () => {
  const stories = detectStories({matches: [{homeTeam: 'A', awayTeam: 'B', homeScore: 1, awayScore: 0, stats: {home: {possession: 60}}}]});
  assert.equal(stories.length, 0);
  for (const story of detectBlowouts({matches: [{homeTeam: 'A', awayTeam: 'B', homeScore: 8, awayScore: 0}]})) {
    assert.ok(story.pontuacao >= 0 && story.pontuacao <= 100);
  }
});
