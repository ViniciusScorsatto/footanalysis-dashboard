import currentJob from './generated/current-job.football.json';
import type {FixtureCard} from '../lib/types';

const fallbackFixtures: FixtureCard[] = [
  {
    homeTeam: 'Vila Nova',
    awayTeam: 'CRB',
    homeScore: 2,
    awayScore: 2,
    homeBadge: {label: 'VN'},
    awayBadge: {label: 'CRB'},
  },
  {
    homeTeam: 'Ceara',
    awayTeam: 'Sao Bernardo',
    homeScore: 1,
    awayScore: 1,
    homeBadge: {label: 'C'},
    awayBadge: {label: 'SB'},
  },
];

export const sampleFixtures: FixtureCard[] =
  'fixtures' in currentJob && Array.isArray(currentJob.fixtures)
    ? (currentJob.fixtures as FixtureCard[])
    : fallbackFixtures;
