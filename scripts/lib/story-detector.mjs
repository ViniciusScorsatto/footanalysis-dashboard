export const STORY_TYPES = Object.freeze({
  LEADERSHIP_CHANGE: 'MUDANCA_LIDERANCA',
  TOP_ZONE_CHANGE: 'MUDANCA_G4_G6',
  RELEGATION_ZONE_CHANGE: 'MUDANCA_Z4',
  BLOWOUT: 'GOLEADA',
  UPSET: 'ZEBRA',
  WINNING_STREAK: 'SEQUENCIA_VITORIAS',
  WINLESS_STREAK: 'SEQUENCIA_SEM_VENCER',
  UNBEATEN_STREAK: 'INVENCIBILIDADE',
  TITLE_RACE: 'CORRIDA_TITULO',
  RELEGATION_BATTLE: 'LUTA_REBAIXAMENTO',
  TOP_SCORER: 'ARTILHARIA',
  STATISTICAL_DOMINANCE: 'DOMINIO_ESTATISTICO',
  EFFICIENCY_WIN: 'VITORIA_EFICIENCIA',
  CRUEL_RESULT: 'RESULTADO_CRUEL',
  MISLEADING_SCORE: 'PLACAR_ENGANOSO',
});

export const STORY_FORMATS = Object.freeze({
  RESULT: 'RESULTADO', CLASSIFICATION: 'CLASSIFICACAO', STATS: 'ESTATISTICAS',
  SCORING: 'ARTILHARIA', STREAK: 'SEQUENCIA', TITLE: 'TITULO', RELEGATION: 'REBAIXAMENTO',
  ROUND_SUMMARY: 'RESUMO_RODADA',
});

export const DEFAULT_RULES = Object.freeze({
  blowoutDifference: 3,
  blowoutWinnerGoals: 4,
  strongScore: 70,
  minSelectedScore: 55,
  maxSelected: 8,
  topZone: 4,
  continentalZone: 6,
  relegationStart: 17,
  streakMinimum: 3,
});

const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));
const teamName = (row) => row.team ?? row.name ?? row.teamName ?? 'Time';
const idOf = (row) => String(row.teamId ?? row.id ?? teamName(row));
const resultFor = (fixture, teamId) => {
  const home = idOf({teamId: fixture.homeTeamId});
  const away = idOf({teamId: fixture.awayTeamId});
  const hs = Number(fixture.homeScore); const as = Number(fixture.awayScore);
  if (!Number.isFinite(hs) || !Number.isFinite(as)) return null;
  if (idOf({teamId}) === home) return hs > as ? 'V' : hs < as ? 'D' : 'E';
  if (idOf({teamId}) === away) return as > hs ? 'V' : as < hs ? 'D' : 'E';
  return null;
};
const fingerprint = (type, teams, key = '') => `${type}:${[...new Set(teams.map(String))].sort().join('|')}:${key}`;
const makeStory = ({type, score, title, summary, justification, teams = [], players = [], evidence = [], format, key = ''}) => ({
  id: fingerprint(type, teams, key), fingerprint: fingerprint(type, teams, key), tipo: type,
  pontuacao: clamp(score), titulo: title, resumo: summary, justificativa: justification,
  times: teams, jogadores: players, evidencias: evidence, formatoRecomendado: format,
  status: 'DETECTADA', historiasRelacionadas: [],
});

const movement = (before, after, positions, type, format, label) => {
  const stories = [];
  const old = new Map((before ?? []).map((row) => [idOf(row), row]));
  for (const row of after ?? []) {
    const previous = old.get(idOf(row));
    if (!previous) continue;
    const wasIn = positions(previous.rank); const isIn = positions(row.rank);
    if (wasIn === isIn) continue;
    const verb = isIn ? 'entra no' : 'sai do';
    stories.push(makeStory({
      type, score: type === STORY_TYPES.LEADERSHIP_CHANGE ? 94 : type === STORY_TYPES.RELEGATION_ZONE_CHANGE ? 86 : 80,
      title: `${teamName(row)} ${verb.toUpperCase()} ${label}!`,
      summary: `${teamName(row)} ${verb} ${label} após os resultados da rodada.`,
      justification: `A posição de ${teamName(row)} mudou de forma efetiva na zona ${label}.`,
      teams: [teamName(row)], evidence: [{metrica: 'posição', antes: previous.rank, depois: row.rank}], format, key: `${idOf(row)}:${isIn ? 'entrada' : 'saida'}`,
    }));
  }
  return stories;
};

export const detectLeadershipChanges = (data) => {
  const before = data.standingsBefore ?? []; const after = data.standingsAfter ?? [];
  const oldLeader = before[0]; const newLeader = after[0];
  if (!oldLeader || !newLeader || idOf(oldLeader) === idOf(newLeader)) return [];
  return [makeStory({type: STORY_TYPES.LEADERSHIP_CHANGE, score: 96,
    title: `${teamName(newLeader).toUpperCase()} ASSUME A LIDERANÇA! 🔥`,
    summary: `${teamName(newLeader)} ultrapassou ${teamName(oldLeader)} e assumiu a ponta do campeonato.`,
    justification: 'Houve mudança efetiva na liderança da competição após a rodada.',
    teams: [teamName(newLeader), teamName(oldLeader)], evidence: [{metrica: 'líder', antes: teamName(oldLeader), depois: teamName(newLeader)}], format: STORY_FORMATS.CLASSIFICATION})];
};

export const detectTableZoneChanges = (data, rules = DEFAULT_RULES) => [
  ...movement(data.standingsBefore, data.standingsAfter, (rank) => rank <= rules.topZone, STORY_TYPES.TOP_ZONE_CHANGE, STORY_FORMATS.CLASSIFICATION, 'G4'),
  ...movement(data.standingsBefore, data.standingsAfter, (rank) => rank <= rules.continentalZone, STORY_TYPES.TOP_ZONE_CHANGE, STORY_FORMATS.CLASSIFICATION, 'G6'),
  ...movement(data.standingsBefore, data.standingsAfter, (rank) => rank >= rules.relegationStart, STORY_TYPES.RELEGATION_ZONE_CHANGE, STORY_FORMATS.RELEGATION, 'Z4'),
];

export const detectBlowouts = (data, rules = DEFAULT_RULES) => (data.matches ?? []).filter((match) => {
  const hs = Number(match.homeScore); const as = Number(match.awayScore);
  return Number.isFinite(hs) && Number.isFinite(as) && Math.abs(hs - as) >= rules.blowoutDifference && Math.max(hs, as) >= rules.blowoutWinnerGoals;
}).map((match) => {
  const winner = Number(match.homeScore) > Number(match.awayScore) ? match.homeTeam : match.awayTeam;
  const loser = winner === match.homeTeam ? match.awayTeam : match.homeTeam;
  const score = Math.min(92, 78 + Math.abs(Number(match.homeScore) - Number(match.awayScore)) * 3);
  return makeStory({type: STORY_TYPES.BLOWOUT, score, title: `${winner.toUpperCase()} ATROPELA ${loser.toUpperCase()}!`,
    summary: `${winner} venceu ${loser} por ${match.homeScore} a ${match.awayScore}, em uma goleada que marcou a rodada.`,
    justification: `A diferença de ${Math.abs(Number(match.homeScore) - Number(match.awayScore))} gols supera o limite editorial configurado para goleada.`,
    teams: [winner, loser], evidence: [{metrica: 'placar', valor: `${match.homeScore}–${match.awayScore}`}], format: STORY_FORMATS.RESULT, key: String(match.fixtureId ?? `${winner}:${loser}`)});
});

const detectStreak = (data, predicate, type, titleFn, format, baseScore) => {
  const all = [...(data.previousMatches ?? []), ...(data.matches ?? [])].filter((m) => Number.isFinite(Number(m.homeScore)) && Number.isFinite(Number(m.awayScore)));
  const teams = new Map();
  all.forEach((m) => [
    [m.homeTeamId ?? m.homeTeam, m.homeTeam], [m.awayTeamId ?? m.awayTeam, m.awayTeam],
  ].forEach(([id, name]) => teams.set(String(id), name)));
  const stories = [];
  for (const [id, name] of teams) {
    const played = all.filter((m) => String(m.homeTeamId ?? m.homeTeam) === id || String(m.awayTeamId ?? m.awayTeam) === id);
    let count = 0; for (let i = played.length - 1; i >= 0 && predicate(resultFor(played[i], id)); i -= 1) count += 1;
    if (count < 3) continue;
    stories.push(makeStory({type, score: Math.min(95, baseScore + (count - 3) * 5), title: titleFn(name, count),
      summary: titleFn(name, count).replace(/!/g, '.') , justification: `A sequência chegou a ${count} jogos consecutivos com evidência nos resultados disponíveis.`,
      teams: [name], evidence: [{metrica: 'sequência', jogos: count}], format, key: `${id}:${count}`}));
  }
  return stories;
};

export const detectStreaks = (data, rules = DEFAULT_RULES) => {
  const min = rules.streakMinimum;
  return [
    ...detectStreak(data, (result) => result === 'V', STORY_TYPES.WINNING_STREAK, (name, count) => `${name.toUpperCase()} CHEGA À ${count}ª VITÓRIA SEGUIDA!`, STORY_FORMATS.STREAK, 78),
    ...detectStreak(data, (result) => result !== 'V', STORY_TYPES.WINLESS_STREAK, (name, count) => `${name.toUpperCase()} ESTÁ HÁ ${count} JOGOS SEM VENCER`, STORY_FORMATS.STREAK, 74),
    ...detectStreak(data, (result) => result !== 'D', STORY_TYPES.UNBEATEN_STREAK, (name, count) => `${name.toUpperCase()} MANTÉM ${count} JOGOS DE INVENCIBILIDADE`, STORY_FORMATS.STREAK, 76),
  ].filter((story) => Number(story.evidencias?.[0]?.jogos ?? 0) >= min);
};

export const detectTitleRace = (data) => {
  const before = data.standingsBefore?.slice(0, 3) ?? []; const after = data.standingsAfter?.slice(0, 3) ?? [];
  if (before.length < 2 || after.length < 2) return [];
  const oldGap = Number(before[1].points) - Number(before[0].points); const newGap = Number(after[1].points) - Number(after[0].points);
  if (oldGap <= newGap || newGap > 3 || oldGap - newGap < 2) return [];
  return [makeStory({type: STORY_TYPES.TITLE_RACE, score: 82, title: 'A BRIGA PELO TÍTULO ESQUENTOU!',
    summary: `${teamName(after[1])} reduziu a distância para ${teamName(after[0])} na liderança.`,
    justification: `A vantagem do líder caiu de ${oldGap} para ${newGap} ponto(s), uma mudança concreta na corrida pelo título.`,
    teams: [teamName(after[0]), teamName(after[1])], evidence: [{metrica: 'vantagem', antes: oldGap, depois: newGap}], format: STORY_FORMATS.TITLE})];
};

export const detectRelegationBattle = (data, rules = DEFAULT_RULES) => {
  const before = data.standingsBefore ?? []; const after = data.standingsAfter ?? [];
  const oldGap = before[rules.relegationStart - 2] && before[rules.relegationStart - 1]
    ? Number(before[rules.relegationStart - 2].points) - Number(before[rules.relegationStart - 1].points) : null;
  const newGap = after[rules.relegationStart - 2] && after[rules.relegationStart - 1]
    ? Number(after[rules.relegationStart - 2].points) - Number(after[rules.relegationStart - 1].points) : null;
  if (oldGap === null || newGap === null || newGap >= oldGap || oldGap - newGap < 2) return [];
  const safe = after[rules.relegationStart - 2]; const danger = after[rules.relegationStart - 1];
  return [makeStory({type: STORY_TYPES.RELEGATION_BATTLE, score: 79, title: 'A LUTA CONTRA O REBAIXAMENTO APERTOU!',
    summary: `${teamName(danger)} encostou em ${teamName(safe)} na linha de segurança do campeonato.`,
    justification: `A diferença para escapar do Z4 caiu de ${oldGap} para ${newGap} ponto(s) após a rodada.`,
    teams: [teamName(danger), teamName(safe)], evidence: [{metrica: 'linhaDeSeguranca', antes: oldGap, depois: newGap}], format: STORY_FORMATS.RELEGATION})];
};

export const detectTopScorerStories = (data) => {
  const before = data.topScorersBefore?.[0]; const after = data.topScorersAfter?.[0];
  if (!after) return [];
  if (before && String(before.playerId ?? before.playerName) !== String(after.playerId ?? after.playerName)) {
    return [makeStory({type: STORY_TYPES.TOP_SCORER, score: 88,
      title: `${after.playerName.toUpperCase()} ASSUME A ARTILHARIA!`,
      summary: `${after.playerName} ultrapassou o antigo líder e assumiu a artilharia do campeonato.`,
      justification: 'Os dados de artilharia registram uma mudança efetiva na liderança.', players: [after.playerName],
      teams: [after.team].filter(Boolean), evidence: [{metrica: 'artilharia', antes: before.playerName, depois: after.playerName}], format: STORY_FORMATS.SCORING})];
  }
  if (Number(after.goals) >= Number(before?.goals ?? 0) + 2) {
    return [makeStory({type: STORY_TYPES.TOP_SCORER, score: 80,
      title: `${after.playerName.toUpperCase()} DISPARA NA ARTILHARIA!`,
      summary: `${after.playerName} abriu vantagem relevante na artilharia com ${after.goals} gols.`,
      justification: 'A vantagem de pelo menos dois gols representa uma separação editorialmente relevante.', players: [after.playerName],
      teams: [after.team].filter(Boolean), evidence: [{metrica: 'gols', valor: after.goals}], format: STORY_FORMATS.SCORING})];
  }
  return [];
};

export const detectStatisticalStories = (data) => (data.matches ?? []).flatMap((match) => {
  const stats = match.stats;
  if (!stats?.home || !stats?.away) return [];
  const possessionHome = Number(stats.home.possession); const possessionAway = Number(stats.away.possession);
  const shotsHome = Number(stats.home.shotsOnGoal); const shotsAway = Number(stats.away.shotsOnGoal);
  if (![possessionHome, possessionAway, shotsHome, shotsAway].every(Number.isFinite)) return [];
  const winner = Number(match.homeScore) > Number(match.awayScore) ? 'home' : Number(match.awayScore) > Number(match.homeScore) ? 'away' : null;
  if (!winner) return [];
  const winnerTeam = winner === 'home' ? match.homeTeam : match.awayTeam;
  const loserTeam = winner === 'home' ? match.awayTeam : match.homeTeam;
  const winnerStats = winner === 'home' ? stats.home : stats.away; const loserStats = winner === 'home' ? stats.away : stats.home;
  const possessionGap = Math.abs(possessionHome - possessionAway); const shotGap = Math.abs(shotsHome - shotsAway);
  if (Number(winnerStats.possession) + 8 < Number(loserStats.possession) && Number(winnerStats.shotsOnGoal) + 2 < Number(loserStats.shotsOnGoal)) {
    return [makeStory({type: STORY_TYPES.EFFICIENCY_WIN, score: 78, title: `${winnerTeam.toUpperCase()} VENCEU NA EFICIÊNCIA!`,
      summary: `${winnerTeam} venceu mesmo produzindo menos volume ofensivo que ${loserTeam}.`,
      justification: `A vitória veio com desvantagem de ${possessionGap} pontos de posse e ${shotGap} finalização(ões) no alvo.`, teams: [winnerTeam, loserTeam],
      evidence: [{metrica: 'posse', mandante: possessionHome, visitante: possessionAway}, {metrica: 'chutesNoAlvo', mandante: shotsHome, visitante: shotsAway}], format: STORY_FORMATS.STATS, key: String(match.fixtureId)})];
  }
  if (possessionGap >= 15 && shotGap >= 3) {
    return [makeStory({type: STORY_TYPES.STATISTICAL_DOMINANCE, score: 76, title: `${winnerTeam.toUpperCase()} DOMINOU A PARTIDA!`,
      summary: `${winnerTeam} controlou posse e volume de finalizações para construir o resultado.`,
      justification: `A diferença combinada de posse (${possessionGap} p.p.) e chutes no alvo (${shotGap}) sustenta a leitura de domínio.`, teams: [winnerTeam, loserTeam],
      evidence: [{metrica: 'posse', mandante: possessionHome, visitante: possessionAway}, {metrica: 'chutesNoAlvo', mandante: shotsHome, visitante: shotsAway}], format: STORY_FORMATS.STATS, key: String(match.fixtureId)})];
  }
  return [];
});

export const detectStories = (data, rules = DEFAULT_RULES) => [
  ...detectLeadershipChanges(data), ...detectTableZoneChanges(data, rules), ...detectBlowouts(data, rules),
  ...detectStreaks(data, rules), ...detectTitleRace(data), ...detectRelegationBattle(data, rules), ...detectTopScorerStories(data), ...detectStatisticalStories(data),
];

export const selectStories = (stories, rules = DEFAULT_RULES) => {
  const sorted = [...stories].sort((a, b) => b.pontuacao - a.pontuacao);
  const selected = []; const rejected = [];
  for (const story of sorted) {
    if (story.pontuacao < rules.minSelectedScore) { rejected.push({...story, status: 'REJEITADA'}); continue; }
    const duplicate = selected.find((item) => {
      const sameType = item.tipo === story.tipo;
      const overlap = story.times.some((team) => item.times.includes(team));
      return sameType && overlap;
    });
    if (duplicate) { duplicate.historiasRelacionadas.push(story.id); rejected.push({...story, status: 'REJEITADA', historiasRelacionadas: [duplicate.id]}); continue; }
    if (selected.length >= rules.maxSelected) { rejected.push({...story, status: 'REJEITADA'}); continue; }
    selected.push(story);
  }
  return {selected, rejected, all: [...selected, ...rejected]};
};
