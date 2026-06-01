import currentJob from './generated/current-job.football.json';
import type {StandingRow} from '../lib/types';

const fallbackStandings: StandingRow[] = [
  {rank: 1, team: 'Liverpool', played: 29, points: 67, goalDifference: 38, badge: {label: 'LIV'}},
  {rank: 2, team: 'Arsenal', played: 29, points: 64, goalDifference: 34, badge: {label: 'ARS'}},
  {rank: 3, team: 'Manchester City', played: 29, points: 63, goalDifference: 31, badge: {label: 'MCI'}},
  {rank: 4, team: 'Aston Villa', played: 29, points: 55, goalDifference: 18, badge: {label: 'AVL'}},
];

export const sampleStandingsRows: StandingRow[] =
  'rows' in currentJob && Array.isArray(currentJob.rows)
    ? (currentJob.rows as unknown as StandingRow[])
    : fallbackStandings;
