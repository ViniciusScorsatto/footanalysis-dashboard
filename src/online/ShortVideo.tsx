import {createElement, type ComponentType} from 'react';
import {FootballFixturesComposition} from '../compositions/FootballFixturesComposition';
import {FootballStandingsComposition} from '../compositions/FootballStandingsComposition';
import {FootballSerieCQuadrangularComposition} from '../compositions/FootballSerieCQuadrangularComposition';
import {FootballSeasonFinalVerdictComposition} from '../compositions/FootballSeasonFinalVerdictComposition';
import {FootballChampionFinalComposition} from '../compositions/FootballChampionFinalComposition';
import {FootballTopScorersComposition} from '../compositions/FootballTopScorersComposition';
import {FootballPlayerOfRoundComposition} from '../compositions/FootballPlayerOfRoundComposition';
import {FootballPaceComposition} from '../compositions/FootballPaceComposition';
import {FootballTierlistComposition} from '../compositions/FootballTierlistComposition';
import {FootballContinentalGroupsComposition} from '../compositions/FootballContinentalGroupsComposition';
import {FootballWorldCupGroupComposition} from '../compositions/FootballWorldCupGroupComposition';
import {FootballWorldCupKnockoutComposition} from '../compositions/FootballWorldCupKnockoutComposition';
import {FootballHistoricalChampionsComposition} from '../compositions/FootballHistoricalChampionsComposition';
import {FootballComparisonComposition} from '../compositions/FootballComparisonComposition';
import type {FootballVideoJob} from '../lib/types';

// One adapter is used by both the mobile Player and the server renderer.
export const shortComponents = {
  results: FootballFixturesComposition,
  'next-games': FootballFixturesComposition,
  predictions: FootballFixturesComposition,
  standings: FootballStandingsComposition,
  'serie-c-quadrangular': FootballSerieCQuadrangularComposition,
  'season-final-verdict': FootballSeasonFinalVerdictComposition,
  'champion-final': FootballChampionFinalComposition,
  'top-scorers': FootballTopScorersComposition,
  'player-of-round': FootballPlayerOfRoundComposition,
  'championship-pace': FootballPaceComposition,
  'relegation-line': FootballPaceComposition,
  tierlist: FootballTierlistComposition,
  'continental-groups-standings': FootballContinentalGroupsComposition,
  'world-cup-group-standings': FootballWorldCupGroupComposition,
  'world-cup-knockout': FootballWorldCupKnockoutComposition,
  'historical-champions': FootballHistoricalChampionsComposition,
  'team-comparison': FootballComparisonComposition,
  'league-comparison': FootballComparisonComposition,
  'top-scorers-comparison': FootballComparisonComposition,
};

export function shortMetadata(job: FootballVideoJob) {
  const durationInFrames = job.template === 'continental-groups-standings' && job.leagueId === 5
    ? Math.max(1, Math.ceil(job.groups.length / 2)) * 180
    : job.durationInFrames;
  if (!Number.isInteger(durationInFrames) || durationInFrames < 1) throw new Error('Invalid video duration');
  return {durationInFrames, fps: 30, width: 1080, height: 1920};
}

export function ShortVideo({job}: {job: FootballVideoJob}) {
  const Component = shortComponents[job.template as keyof typeof shortComponents];
  if (!Component) throw new Error('Unsupported online template');
  const variant = job.template === 'championship-pace' ? 'championship'
    : job.template === 'relegation-line' ? 'relegation' : job.template;
  const props = {...job, job, variant, presentation: job.videoMode === 'static' ? 'static' : 'animated'};
  return createElement(Component as ComponentType<typeof props>, props);
}
