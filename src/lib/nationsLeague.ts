import type {ContinentalGroupStandingsGroup} from './types';

type Row = ContinentalGroupStandingsGroup['rows'][number];
export const nationsLeagueDivision = (label: string) =>
  (label.match(/^([A-D])\d+$/i)?.[1] ?? label.match(/(?:league|liga)\s+([A-D])/i)?.[1])?.toUpperCase();

export type NationsLeagueZone = 'quarters' | 'promotion' | 'playoff' | 'playoffBC' | 'relegation' | 'stay' | 'pending';

// UEFA article 19.01: stop at missing data; never break ties by team name or array order.
const compareRows = (a: Row, b: Row): number | null => {
  const fields = ['points', 'goalDifference', 'goalsFor', 'awayGoals', 'wins', 'awayWins', 'disciplinaryPoints', 'accessRank'] as const;
  for (const field of fields) {
    const left = a[field];
    const right = b[field];
    if (typeof left !== 'number' || typeof right !== 'number') return null;
    const difference = left - right;
    if (difference !== 0) return (field === 'disciplinaryPoints' || field === 'accessRank') ? -difference : difference;
  }
  return null;
};

export const nationsLeagueZone = (group: ContinentalGroupStandingsGroup, row: Row, groups: ContinentalGroupStandingsGroup[]): NationsLeagueZone => {
  const league = nationsLeagueDivision(group.groupKey);
  if (league === 'D') return 'promotion';
  if (league === 'B' || league === 'C') {
    if (row.rank === 1) return 'promotion';
    if (league === 'B' && row.rank === 2) return 'playoff';
    if ((league === 'C' && row.rank === 2) || (league === 'B' && row.rank === 4)) return 'playoffBC';
    return 'stay';
  }
  if (league !== 'A') return 'pending';
  if (row.rank <= 2) return 'quarters';
  const peers = groups.filter((g) => nationsLeagueDivision(g.groupKey) === 'A')
    .flatMap((g) => g.rows.filter((r) => r.rank === row.rank));
  if (peers.length !== 4) return 'pending';
  let better = 0;
  let unknown = 0;
  for (const peer of peers) {
    if (peer === row) continue;
    const comparison = compareRows(peer, row);
    if (comparison === null) unknown++;
    else if (comparison > 0) better++;
  }
  if (better < 2 && better + unknown >= 2) return 'pending';
  const topTwo = better < 2;
  return row.rank === 3 ? (topTwo ? 'stay' : 'playoff') : (topTwo ? 'playoff' : 'relegation');
};

export const nationsLeagueLegend = (league: string | undefined, english: boolean) => {
  const item = (color: string, en: string, pt: string) => ({color, label: english ? en : pt});
  if (league === 'A') return [
    item('#0A84FF', 'Top 2 • Quarter-finals', 'Top 2 • Quartas de final'),
    item('#8da0b3', 'Best 2 thirds • Stay in A', '2 melhores terceiros • Permanecem na A'),
    item('#E67E22', 'Bottom 2 thirds + best 2 fourths • A/B play-offs', '2 piores terceiros + 2 melhores quartos • Playoffs A/B'),
    item('#E74C3C', 'Bottom 2 fourths • To League B', '2 piores quartos • Liga B'),
  ];
  if (league === 'B') return [
    item('#27AE60', '1st • To League A', '1º • Liga A'),
    item('#E67E22', '2nd • A/B play-offs', '2º • Playoffs A/B'),
    item('#8da0b3', '3rd • Stay in B', '3º • Permanece na B'),
    item('#A78BFA', '4th • B/C play-offs', '4º • Playoffs B/C'),
  ];
  if (league === 'C') return [
    item('#27AE60', '1st • To League B', '1º • Liga B'),
    item('#A78BFA', '2nd • B/C play-offs', '2º • Playoffs B/C'),
    item('#8da0b3', '3rd–4th • Stay in C', '3º–4º • Permanecem na C'),
  ];
  if (league === 'D') return [item('#27AE60', 'All teams • To League C', 'Todas as seleções • Liga C')];
  return [];
};
