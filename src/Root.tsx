import {Composition} from 'remotion';
import {FootballContinentalGroupsComposition} from './compositions/FootballContinentalGroupsComposition';
import {FootballChampionFinalComposition} from './compositions/FootballChampionFinalComposition';
import {FootballFixturesComposition} from './compositions/FootballFixturesComposition';
import {FootballPaceComposition} from './compositions/FootballPaceComposition';
import {FootballPlayerOfRoundComposition} from './compositions/FootballPlayerOfRoundComposition';
import {FootballPredictionsLongComposition} from './compositions/FootballPredictionsLongComposition';
import {FootballRoundSummaryLongComposition} from './compositions/FootballRoundSummaryLongComposition';
import {FootballSeasonFinalVerdictComposition} from './compositions/FootballSeasonFinalVerdictComposition';
import {FootballStandingsComposition} from './compositions/FootballStandingsComposition';
import {FootballThumbnailComposition} from './compositions/FootballThumbnailComposition';
import {FootballTierlistComposition} from './compositions/FootballTierlistComposition';
import {FootballTopScorersComposition} from './compositions/FootballTopScorersComposition';
import {FootballWorldCupGroupComposition} from './compositions/FootballWorldCupGroupComposition';
import {FootballWorldCupKnockoutComposition} from './compositions/FootballWorldCupKnockoutComposition';
import footballResultsJobJson from './data/generated/current-job.football.results.json';
import footballCurrentJobJson from './data/generated/current-job.football.json';
import footballNextGamesJobJson from './data/generated/current-job.football.next-games.json';
import footballPredictionsJobJson from './data/generated/current-job.football.predictions.json';
import footballPredictionsLongJobJson from './data/generated/current-job.football.predictions-long.json';
import footballRoundSummaryLongJobJson from './data/generated/current-job.football.round-summary-long.json';
import footballThumbnailJobJson from './data/generated/current-job.football.thumbnail.json';
import footballStandingsJobJson from './data/generated/current-job.football.standings.json';
import footballSeasonFinalVerdictJobJson from './data/generated/current-job.football.season-final-verdict.json';
import footballChampionFinalJobJson from './data/generated/current-job.football.champion-final.json';
import footballTopScorersJobJson from './data/generated/current-job.football.top-scorers.json';
import footballPlayerOfRoundJobJson from './data/generated/current-job.football.player-of-round.json';
import footballChampionshipPaceJobJson from './data/generated/current-job.football.championship-pace.json';
import footballRelegationLineJobJson from './data/generated/current-job.football.relegation-line.json';
import footballTierlistJobJson from './data/generated/current-job.football.tierlist.json';
import footballContinentalGroupsJobJson from './data/generated/current-job.football.continental-groups-standings.json';
import footballWorldCupGroupJobJson from './data/generated/current-job.football.world-cup-group-standings.json';
import footballWorldCupKnockoutJobJson from './data/generated/current-job.football.world-cup-knockout.json';
import {sampleContinentalGroupsJob} from './data/continentalGroups';
import {sampleChampionFinalJob} from './data/championFinal';
import {sampleChampionshipPaceJob, sampleRelegationLineJob} from './data/pace';
import {samplePlayerOfRoundJob} from './data/playerOfRound';
import {sampleSeasonFinalVerdictJob} from './data/seasonFinalVerdict';
import {sampleFixtures} from './data/results';
import {sampleStandingsRows} from './data/standings';
import {sampleTopScorersJob} from './data/topScorers';
import {sampleWorldCupGroupJob, sampleWorldCupKnockoutJob} from './data/worldCup';
import type {
  FootballPredictionsLongVideoJob,
  FootballRoundSummaryLongVideoJob,
  TierlistVideoJob,
  FootballVideoJob,
} from './lib/types';
import type {FootballThumbnailJob} from './lib/types';

const footballResultsJob = footballResultsJobJson as Partial<FootballVideoJob>;
const footballCurrentJob = footballCurrentJobJson as Partial<FootballVideoJob>;
const footballNextGamesJob = footballNextGamesJobJson as Partial<FootballVideoJob>;
const footballPredictionsJob = footballPredictionsJobJson as Partial<FootballVideoJob>;
const footballPredictionsLongJob =
  footballPredictionsLongJobJson as Partial<FootballVideoJob>;
const footballRoundSummaryLongJob =
  footballRoundSummaryLongJobJson as Partial<FootballVideoJob>;
const footballThumbnailJob = footballThumbnailJobJson as Partial<FootballThumbnailJob>;
const footballStandingsJob = footballStandingsJobJson as Partial<FootballVideoJob>;
const footballSeasonFinalVerdictJob =
  footballSeasonFinalVerdictJobJson as Partial<FootballVideoJob>;
const footballChampionFinalJob = footballChampionFinalJobJson as Partial<FootballVideoJob>;
const footballTopScorersJob = footballTopScorersJobJson as Partial<FootballVideoJob>;
const footballPlayerOfRoundJob = footballPlayerOfRoundJobJson as Partial<FootballVideoJob>;
const footballChampionshipPaceJob = footballChampionshipPaceJobJson as Partial<FootballVideoJob>;
const footballRelegationLineJob = footballRelegationLineJobJson as Partial<FootballVideoJob>;
const footballTierlistJob =
  footballCurrentJob.template === 'tierlist'
    ? footballCurrentJob
    : (footballTierlistJobJson as Partial<FootballVideoJob>);
const footballContinentalGroupsJob = footballContinentalGroupsJobJson as Partial<FootballVideoJob>;
const footballWorldCupGroupJob = footballWorldCupGroupJobJson as Partial<FootballVideoJob>;
const footballWorldCupKnockoutJob = footballWorldCupKnockoutJobJson as Partial<FootballVideoJob>;
const defaultFootballSoundtrack = '/audio/football/fun-vibe-dyalla.mp3';
const defaultFootballBrandLogo = '/branding/foot-analysis-logo.png';

const thumbnailJob: FootballThumbnailJob = {
  sport: 'football',
  template: 'thumbnail',
  compositionId: 'FootballThumbnailStill',
  channelProfile: footballThumbnailJob.channelProfile ?? 'pt',
  languageProfile: footballThumbnailJob.languageProfile ?? 'pt-br',
  preset: footballThumbnailJob.preset ?? 'matchup',
  thumbnailModel: footballThumbnailJob.thumbnailModel ?? 'model-4',
  brandName: footballThumbnailJob.brandName ?? 'Foot Analysis',
  brandLogoPath: footballThumbnailJob.brandLogoPath ?? defaultFootballBrandLogo,
  leagueName: footballThumbnailJob.leagueName ?? 'Brasileirão Série A',
  headline: footballThumbnailJob.headline ?? 'RESUMO DA RODADA 18',
  subheadline: footballThumbnailJob.subheadline ?? 'BRASILEIRÃO',
  extraLabel: footballThumbnailJob.extraLabel ?? 'PALPITES · ANÁLISES · ESTATÍSTICAS',
  outputName: footballThumbnailJob.outputName ?? 'football-thumbnail.png',
  accentColor: footballThumbnailJob.accentColor ?? '#A7FF12',
  secondaryAccentColor: footballThumbnailJob.secondaryAccentColor,
  backgroundImagePath:
    footballThumbnailJob.backgroundImagePath ?? '/backgrounds/thumbnails/neon-stadium-copa-bg.png',
  teamA: footballThumbnailJob.teamA ?? {
    label: 'Corinthians',
    logoPath: '/logos/corinthians.png',
    accentColor: '#E51B23',
  },
  teamB: footballThumbnailJob.teamB ?? {
    label: 'Athletico',
    logoPath: '/logos/atletico-paranaense.png',
    accentColor: '#E3222A',
  },
  teamC: footballThumbnailJob.teamC,
  teamD: footballThumbnailJob.teamD,
  teamE: footballThumbnailJob.teamE,
  teamF: footballThumbnailJob.teamF,
};

const resultsProps = {
  channelProfile:
    footballResultsJob.template === 'results' && footballResultsJob.channelProfile
      ? footballResultsJob.channelProfile
      : footballResultsJob.languageProfile === 'en'
        ? 'en'
        : 'pt',
  languageProfile:
    footballResultsJob.template === 'results' && footballResultsJob.languageProfile
      ? footballResultsJob.languageProfile
      : 'pt-br',
  leagueName:
    footballResultsJob.template === 'results' && footballResultsJob.leagueName
      ? footballResultsJob.leagueName
      : 'Serie B 2026',
  roundLabel:
    footballResultsJob.template === 'results' && footballResultsJob.roundLabel
      ? footballResultsJob.roundLabel
      : 'Resultados da Rodada 1',
  fixtures:
    footballResultsJob.template === 'results' && Array.isArray(footballResultsJob.fixtures)
      ? footballResultsJob.fixtures
      : sampleFixtures,
  brandName: footballResultsJob.brandName ?? 'Foot Analysis',
  brandLogoPath: footballResultsJob.brandLogoPath,
  backgroundImagePath: footballResultsJob.backgroundImagePath,
  soundtrackPath: footballResultsJob.soundtrackPath ?? defaultFootballSoundtrack,
  soundtrackVolume: footballResultsJob.soundtrackVolume ?? 0.2,
  voiceoverPath:
    footballResultsJob.template === 'results' ? footballResultsJob.voiceoverPath : undefined,
  introTitle:
    footballResultsJob.template === 'results' ? footballResultsJob.introTitle : undefined,
  introSubtitle:
    footballResultsJob.template === 'results' ? footballResultsJob.introSubtitle : undefined,
  hookText:
    footballResultsJob.template === 'results' ? footballResultsJob.hookText : undefined,
  coldOpenData:
    footballResultsJob.template === 'results' ? footballResultsJob.coldOpenData : undefined,
  leagueConfig: footballResultsJob.leagueConfig,
  ctaText:
    footballResultsJob.template === 'results'
      ? footballResultsJob.ctaText
      : 'Qual foi o melhor jogo?',
  variant: 'results' as const,
};

const predictionsProps = {
  ...resultsProps,
  variant: 'predictions' as const,
  channelProfile:
    footballPredictionsJob.template === 'predictions' && footballPredictionsJob.channelProfile
      ? footballPredictionsJob.channelProfile
      : footballPredictionsJob.languageProfile === 'en'
        ? 'en'
        : resultsProps.channelProfile,
  languageProfile:
    footballPredictionsJob.template === 'predictions' && footballPredictionsJob.languageProfile
      ? footballPredictionsJob.languageProfile
      : resultsProps.languageProfile,
  leagueName:
    footballPredictionsJob.template === 'predictions' && footballPredictionsJob.leagueName
      ? footballPredictionsJob.leagueName
      : resultsProps.leagueName,
  roundLabel:
    footballPredictionsJob.template === 'predictions' && footballPredictionsJob.roundLabel
      ? footballPredictionsJob.roundLabel
      : 'Palpites da Proxima Rodada',
  fixtures:
    footballPredictionsJob.template === 'predictions' &&
      Array.isArray(footballPredictionsJob.fixtures)
      ? footballPredictionsJob.fixtures
      : sampleFixtures.map((fixture) => ({
          ...fixture,
          homeScore: null,
          awayScore: null,
        })),
  brandName: footballPredictionsJob.brandName ?? resultsProps.brandName,
  brandLogoPath: footballPredictionsJob.brandLogoPath ?? resultsProps.brandLogoPath,
  backgroundImagePath:
    footballPredictionsJob.backgroundImagePath ?? resultsProps.backgroundImagePath,
  soundtrackPath: footballPredictionsJob.soundtrackPath ?? defaultFootballSoundtrack,
  soundtrackVolume: footballPredictionsJob.soundtrackVolume ?? resultsProps.soundtrackVolume,
  voiceoverPath:
    footballPredictionsJob.template === 'predictions'
      ? footballPredictionsJob.voiceoverPath
      : undefined,
  introTitle:
    footballPredictionsJob.template === 'predictions'
      ? footballPredictionsJob.introTitle
      : undefined,
  introSubtitle:
    footballPredictionsJob.template === 'predictions'
      ? footballPredictionsJob.introSubtitle
      : undefined,
  hookText:
    footballPredictionsJob.template === 'predictions'
      ? footballPredictionsJob.hookText
      : undefined,
  coldOpenData:
    footballPredictionsJob.template === 'predictions'
      ? footballPredictionsJob.coldOpenData
      : undefined,
  leagueConfig: footballPredictionsJob.leagueConfig ?? resultsProps.leagueConfig,
  ctaText:
    footballPredictionsJob.template === 'predictions'
      ? footballPredictionsJob.ctaText
      : 'Quem vence essa rodada?',
};

const nextGamesProps = {
  ...resultsProps,
  variant: 'next-games' as const,
  channelProfile:
    footballNextGamesJob.template === 'next-games' && footballNextGamesJob.channelProfile
      ? footballNextGamesJob.channelProfile
      : footballNextGamesJob.languageProfile === 'en'
        ? 'en'
        : resultsProps.channelProfile,
  languageProfile:
    footballNextGamesJob.template === 'next-games' && footballNextGamesJob.languageProfile
      ? footballNextGamesJob.languageProfile
      : resultsProps.languageProfile,
  leagueName:
    footballNextGamesJob.template === 'next-games' && footballNextGamesJob.leagueName
      ? footballNextGamesJob.leagueName
      : resultsProps.leagueName,
  roundLabel:
    footballNextGamesJob.template === 'next-games' && footballNextGamesJob.roundLabel
      ? footballNextGamesJob.roundLabel
      : footballNextGamesJob.languageProfile === 'en'
        ? 'Upcoming Fixtures'
        : 'Próximos Jogos',
  fixtures:
    footballNextGamesJob.template === 'next-games' &&
    Array.isArray(footballNextGamesJob.fixtures) &&
    footballNextGamesJob.fixtures.length > 0
      ? footballNextGamesJob.fixtures
      : sampleFixtures.map((fixture) => ({
          ...fixture,
          homeScore: null,
          awayScore: null,
        })),
  brandName: footballNextGamesJob.brandName ?? resultsProps.brandName,
  brandLogoPath: footballNextGamesJob.brandLogoPath ?? resultsProps.brandLogoPath,
  backgroundImagePath: footballNextGamesJob.backgroundImagePath ?? resultsProps.backgroundImagePath,
  soundtrackPath: footballNextGamesJob.soundtrackPath ?? defaultFootballSoundtrack,
  soundtrackVolume: footballNextGamesJob.soundtrackVolume ?? resultsProps.soundtrackVolume,
  voiceoverPath:
    footballNextGamesJob.template === 'next-games' ? footballNextGamesJob.voiceoverPath : undefined,
  introTitle:
    footballNextGamesJob.template === 'next-games' ? footballNextGamesJob.introTitle : undefined,
  introSubtitle:
    footballNextGamesJob.template === 'next-games' ? footballNextGamesJob.introSubtitle : undefined,
  hookText:
    footballNextGamesJob.template === 'next-games' ? footballNextGamesJob.hookText : undefined,
  coldOpenData:
    footballNextGamesJob.template === 'next-games' ? footballNextGamesJob.coldOpenData : undefined,
  leagueConfig: footballNextGamesJob.leagueConfig,
  ctaText:
    footballNextGamesJob.template === 'next-games'
      ? footballNextGamesJob.ctaText
      : footballNextGamesJob.languageProfile === 'en'
        ? 'Which match is must-watch?'
        : 'Qual jogo você vai assistir?',
};

const predictionsLongFallback =
  footballPredictionsLongJobJson as FootballPredictionsLongVideoJob;
const predictionsLongProps = {
  job:
    footballPredictionsLongJob.template === 'predictions-long'
      ? (footballPredictionsLongJob as FootballPredictionsLongVideoJob)
      : predictionsLongFallback,
};

const roundSummaryLongFallback =
  footballRoundSummaryLongJobJson as FootballRoundSummaryLongVideoJob;
const roundSummaryLongProps = {
  job:
    footballRoundSummaryLongJob.template === 'round-summary-long'
      ? (footballRoundSummaryLongJob as FootballRoundSummaryLongVideoJob)
      : roundSummaryLongFallback,
};

const standingsProps = {
  channelProfile:
    footballStandingsJob.template === 'standings' && footballStandingsJob.channelProfile
      ? footballStandingsJob.channelProfile
      : footballStandingsJob.languageProfile === 'en'
        ? 'en'
        : 'pt',
  languageProfile:
    footballStandingsJob.template === 'standings' && footballStandingsJob.languageProfile
      ? footballStandingsJob.languageProfile
      : 'pt-br',
  leagueName:
    footballStandingsJob.template === 'standings' && footballStandingsJob.leagueName
      ? footballStandingsJob.leagueName
      : 'Serie B 2026',
  standingsLabel:
    footballStandingsJob.template === 'standings' && footballStandingsJob.standingsLabel
      ? footballStandingsJob.standingsLabel
      : footballStandingsJob.languageProfile === 'en'
        ? 'Current Table'
        : 'Classificação Atual',
  rows:
    footballStandingsJob.template === 'standings' && Array.isArray(footballStandingsJob.rows)
      ? footballStandingsJob.rows
      : sampleStandingsRows,
  leagueConfig: footballStandingsJob.leagueConfig,
  brandName: footballStandingsJob.brandName ?? 'Foot Analysis',
  brandLogoPath: footballStandingsJob.brandLogoPath,
  backgroundImagePath: footballStandingsJob.backgroundImagePath,
  soundtrackPath: footballStandingsJob.soundtrackPath ?? defaultFootballSoundtrack,
  soundtrackVolume: footballStandingsJob.soundtrackVolume ?? 0.2,
  voiceoverPath:
    footballStandingsJob.template === 'standings' ? footballStandingsJob.voiceoverPath : undefined,
  introTitle:
    footballStandingsJob.template === 'standings' ? footballStandingsJob.introTitle : undefined,
  introSubtitle:
    footballStandingsJob.template === 'standings' ? footballStandingsJob.introSubtitle : undefined,
  hookText:
    footballStandingsJob.template === 'standings' ? footballStandingsJob.hookText : undefined,
  coldOpenData:
    footballStandingsJob.template === 'standings' ? footballStandingsJob.coldOpenData : undefined,
  ctaText:
    footballStandingsJob.template === 'standings'
      ? footballStandingsJob.ctaText
      : 'Quem fica com a taça?',
};

const seasonFinalVerdictProps = {
  channelProfile:
    footballSeasonFinalVerdictJob.template === 'season-final-verdict' &&
    footballSeasonFinalVerdictJob.channelProfile
      ? footballSeasonFinalVerdictJob.channelProfile
      : sampleSeasonFinalVerdictJob.channelProfile,
  leagueName:
    footballSeasonFinalVerdictJob.template === 'season-final-verdict' &&
    footballSeasonFinalVerdictJob.leagueName
      ? footballSeasonFinalVerdictJob.leagueName
      : sampleSeasonFinalVerdictJob.leagueName,
  titleLabel:
    footballSeasonFinalVerdictJob.template === 'season-final-verdict' &&
    footballSeasonFinalVerdictJob.titleLabel
      ? footballSeasonFinalVerdictJob.titleLabel
      : sampleSeasonFinalVerdictJob.titleLabel,
  subtitleLabel:
    footballSeasonFinalVerdictJob.template === 'season-final-verdict' &&
    footballSeasonFinalVerdictJob.subtitleLabel
      ? footballSeasonFinalVerdictJob.subtitleLabel
      : sampleSeasonFinalVerdictJob.subtitleLabel,
  champion:
    footballSeasonFinalVerdictJob.template === 'season-final-verdict' &&
    footballSeasonFinalVerdictJob.champion
      ? footballSeasonFinalVerdictJob.champion
      : sampleSeasonFinalVerdictJob.champion,
  qualificationGroups:
    footballSeasonFinalVerdictJob.template === 'season-final-verdict' &&
    Array.isArray(footballSeasonFinalVerdictJob.qualificationGroups)
      ? footballSeasonFinalVerdictJob.qualificationGroups
      : sampleSeasonFinalVerdictJob.qualificationGroups,
  relegationGroup:
    footballSeasonFinalVerdictJob.template === 'season-final-verdict' &&
    footballSeasonFinalVerdictJob.relegationGroup
      ? footballSeasonFinalVerdictJob.relegationGroup
      : sampleSeasonFinalVerdictJob.relegationGroup,
  leagueConfig:
    footballSeasonFinalVerdictJob.template === 'season-final-verdict'
      ? footballSeasonFinalVerdictJob.leagueConfig
      : sampleSeasonFinalVerdictJob.leagueConfig,
  brandName: footballSeasonFinalVerdictJob.brandName ?? sampleSeasonFinalVerdictJob.brandName,
  brandLogoPath:
    footballSeasonFinalVerdictJob.template === 'season-final-verdict'
      ? footballSeasonFinalVerdictJob.brandLogoPath
      : sampleSeasonFinalVerdictJob.brandLogoPath,
  soundtrackPath:
    footballSeasonFinalVerdictJob.template === 'season-final-verdict'
      ? footballSeasonFinalVerdictJob.soundtrackPath ?? defaultFootballSoundtrack
      : sampleSeasonFinalVerdictJob.soundtrackPath ?? defaultFootballSoundtrack,
  soundtrackVolume:
    footballSeasonFinalVerdictJob.template === 'season-final-verdict'
      ? footballSeasonFinalVerdictJob.soundtrackVolume ?? 0.2
      : sampleSeasonFinalVerdictJob.soundtrackVolume ?? 0.2,
  voiceoverPath:
    footballSeasonFinalVerdictJob.template === 'season-final-verdict'
      ? footballSeasonFinalVerdictJob.voiceoverPath
      : sampleSeasonFinalVerdictJob.voiceoverPath,
  introTitle:
    footballSeasonFinalVerdictJob.template === 'season-final-verdict'
      ? footballSeasonFinalVerdictJob.introTitle
      : sampleSeasonFinalVerdictJob.introTitle,
  introSubtitle:
    footballSeasonFinalVerdictJob.template === 'season-final-verdict'
      ? footballSeasonFinalVerdictJob.introSubtitle
      : sampleSeasonFinalVerdictJob.introSubtitle,
  hookText:
    footballSeasonFinalVerdictJob.template === 'season-final-verdict'
      ? footballSeasonFinalVerdictJob.hookText
      : sampleSeasonFinalVerdictJob.hookText,
  coldOpenData:
    footballSeasonFinalVerdictJob.template === 'season-final-verdict'
      ? footballSeasonFinalVerdictJob.coldOpenData
      : sampleSeasonFinalVerdictJob.coldOpenData,
  ctaText:
    footballSeasonFinalVerdictJob.template === 'season-final-verdict'
      ? footballSeasonFinalVerdictJob.ctaText
      : sampleSeasonFinalVerdictJob.ctaText,
};

const championFinalProps = {
  channelProfile:
    footballChampionFinalJob.template === 'champion-final' &&
    footballChampionFinalJob.channelProfile
      ? footballChampionFinalJob.channelProfile
      : sampleChampionFinalJob.channelProfile,
  leagueName:
    footballChampionFinalJob.template === 'champion-final' && footballChampionFinalJob.leagueName
      ? footballChampionFinalJob.leagueName
      : sampleChampionFinalJob.leagueName,
  titleLabel:
    footballChampionFinalJob.template === 'champion-final' && footballChampionFinalJob.titleLabel
      ? footballChampionFinalJob.titleLabel
      : sampleChampionFinalJob.titleLabel,
  subtitleLabel:
    footballChampionFinalJob.template === 'champion-final' &&
    footballChampionFinalJob.subtitleLabel
      ? footballChampionFinalJob.subtitleLabel
      : sampleChampionFinalJob.subtitleLabel,
  seasonLabel:
    footballChampionFinalJob.template === 'champion-final' &&
    footballChampionFinalJob.seasonLabel
      ? footballChampionFinalJob.seasonLabel
      : sampleChampionFinalJob.seasonLabel,
  championTeam:
    footballChampionFinalJob.template === 'champion-final' &&
    footballChampionFinalJob.championTeam
      ? footballChampionFinalJob.championTeam
      : sampleChampionFinalJob.championTeam,
  championBadge:
    footballChampionFinalJob.template === 'champion-final' &&
    footballChampionFinalJob.championBadge
      ? footballChampionFinalJob.championBadge
      : sampleChampionFinalJob.championBadge,
  finalFixture:
    footballChampionFinalJob.template === 'champion-final'
      ? footballChampionFinalJob.finalFixture
      : sampleChampionFinalJob.finalFixture,
  leagueConfig:
    footballChampionFinalJob.template === 'champion-final'
      ? footballChampionFinalJob.leagueConfig
      : sampleChampionFinalJob.leagueConfig,
  brandName: footballChampionFinalJob.brandName ?? sampleChampionFinalJob.brandName,
  brandLogoPath:
    footballChampionFinalJob.template === 'champion-final'
      ? footballChampionFinalJob.brandLogoPath
      : sampleChampionFinalJob.brandLogoPath,
  soundtrackPath:
    footballChampionFinalJob.template === 'champion-final'
      ? footballChampionFinalJob.soundtrackPath ?? defaultFootballSoundtrack
      : sampleChampionFinalJob.soundtrackPath ?? defaultFootballSoundtrack,
  soundtrackVolume:
    footballChampionFinalJob.template === 'champion-final'
      ? footballChampionFinalJob.soundtrackVolume ?? 0.2
      : sampleChampionFinalJob.soundtrackVolume ?? 0.2,
  voiceoverPath:
    footballChampionFinalJob.template === 'champion-final'
      ? footballChampionFinalJob.voiceoverPath
      : sampleChampionFinalJob.voiceoverPath,
  introTitle:
    footballChampionFinalJob.template === 'champion-final'
      ? footballChampionFinalJob.introTitle
      : sampleChampionFinalJob.introTitle,
  introSubtitle:
    footballChampionFinalJob.template === 'champion-final'
      ? footballChampionFinalJob.introSubtitle
      : sampleChampionFinalJob.introSubtitle,
  hookText:
    footballChampionFinalJob.template === 'champion-final'
      ? footballChampionFinalJob.hookText
      : sampleChampionFinalJob.hookText,
  coldOpenData:
    footballChampionFinalJob.template === 'champion-final'
      ? footballChampionFinalJob.coldOpenData
      : sampleChampionFinalJob.coldOpenData,
  ctaText:
    footballChampionFinalJob.template === 'champion-final'
      ? footballChampionFinalJob.ctaText
      : sampleChampionFinalJob.ctaText,
};

const topScorersProps = {
  channelProfile:
    footballTopScorersJob.template === 'top-scorers' && footballTopScorersJob.channelProfile
      ? footballTopScorersJob.channelProfile
      : sampleTopScorersJob.channelProfile,
  languageProfile:
    footballTopScorersJob.template === 'top-scorers' && footballTopScorersJob.languageProfile
      ? footballTopScorersJob.languageProfile
      : sampleTopScorersJob.languageProfile,
  leagueName:
    footballTopScorersJob.template === 'top-scorers' && footballTopScorersJob.leagueName
      ? footballTopScorersJob.leagueName
      : sampleTopScorersJob.leagueName,
  titleLabel:
    footballTopScorersJob.template === 'top-scorers' && footballTopScorersJob.titleLabel
      ? footballTopScorersJob.titleLabel
      : sampleTopScorersJob.titleLabel,
  subtitleLabel:
    footballTopScorersJob.template === 'top-scorers' && footballTopScorersJob.subtitleLabel
      ? footballTopScorersJob.subtitleLabel
      : sampleTopScorersJob.subtitleLabel,
  entries:
    footballTopScorersJob.template === 'top-scorers' &&
    Array.isArray(footballTopScorersJob.entries)
      ? footballTopScorersJob.entries
      : sampleTopScorersJob.entries,
  leagueConfig:
    footballTopScorersJob.template === 'top-scorers'
      ? footballTopScorersJob.leagueConfig
      : sampleTopScorersJob.leagueConfig,
  brandName: footballTopScorersJob.brandName ?? sampleTopScorersJob.brandName,
  brandLogoPath:
    footballTopScorersJob.template === 'top-scorers'
      ? footballTopScorersJob.brandLogoPath
      : sampleTopScorersJob.brandLogoPath,
  soundtrackPath:
    footballTopScorersJob.template === 'top-scorers'
      ? footballTopScorersJob.soundtrackPath ?? defaultFootballSoundtrack
      : sampleTopScorersJob.soundtrackPath ?? defaultFootballSoundtrack,
  soundtrackVolume:
    footballTopScorersJob.template === 'top-scorers'
      ? footballTopScorersJob.soundtrackVolume ?? 0.2
      : sampleTopScorersJob.soundtrackVolume ?? 0.2,
  voiceoverPath:
    footballTopScorersJob.template === 'top-scorers'
      ? footballTopScorersJob.voiceoverPath
      : sampleTopScorersJob.voiceoverPath,
  introTitle:
    footballTopScorersJob.template === 'top-scorers'
      ? footballTopScorersJob.introTitle
      : sampleTopScorersJob.introTitle,
  introSubtitle:
    footballTopScorersJob.template === 'top-scorers'
      ? footballTopScorersJob.introSubtitle
      : sampleTopScorersJob.introSubtitle,
  hookText:
    footballTopScorersJob.template === 'top-scorers'
      ? footballTopScorersJob.hookText
      : sampleTopScorersJob.hookText,
  coldOpenData:
    footballTopScorersJob.template === 'top-scorers'
      ? footballTopScorersJob.coldOpenData
      : sampleTopScorersJob.coldOpenData,
  ctaText:
    footballTopScorersJob.template === 'top-scorers'
      ? footballTopScorersJob.ctaText
      : sampleTopScorersJob.ctaText,
};

const playerOfRoundProps = {
  channelProfile:
    footballPlayerOfRoundJob.template === 'player-of-round' &&
    footballPlayerOfRoundJob.channelProfile
      ? footballPlayerOfRoundJob.channelProfile
      : samplePlayerOfRoundJob.channelProfile,
  languageProfile:
    footballPlayerOfRoundJob.template === 'player-of-round' &&
    footballPlayerOfRoundJob.languageProfile
      ? footballPlayerOfRoundJob.languageProfile
      : samplePlayerOfRoundJob.languageProfile,
  leagueName:
    footballPlayerOfRoundJob.template === 'player-of-round' && footballPlayerOfRoundJob.leagueName
      ? footballPlayerOfRoundJob.leagueName
      : samplePlayerOfRoundJob.leagueName,
  titleLabel:
    footballPlayerOfRoundJob.template === 'player-of-round' && footballPlayerOfRoundJob.titleLabel
      ? footballPlayerOfRoundJob.titleLabel
      : samplePlayerOfRoundJob.titleLabel,
  subtitleLabel:
    footballPlayerOfRoundJob.template === 'player-of-round' &&
    footballPlayerOfRoundJob.subtitleLabel
      ? footballPlayerOfRoundJob.subtitleLabel
      : samplePlayerOfRoundJob.subtitleLabel,
  entries:
    footballPlayerOfRoundJob.template === 'player-of-round' &&
    Array.isArray(footballPlayerOfRoundJob.entries)
      ? footballPlayerOfRoundJob.entries
      : samplePlayerOfRoundJob.entries,
  leagueConfig:
    footballPlayerOfRoundJob.template === 'player-of-round'
      ? footballPlayerOfRoundJob.leagueConfig
      : samplePlayerOfRoundJob.leagueConfig,
  brandName: footballPlayerOfRoundJob.brandName ?? samplePlayerOfRoundJob.brandName,
  brandLogoPath:
    footballPlayerOfRoundJob.template === 'player-of-round'
      ? footballPlayerOfRoundJob.brandLogoPath
      : samplePlayerOfRoundJob.brandLogoPath,
  soundtrackPath:
    footballPlayerOfRoundJob.template === 'player-of-round'
      ? footballPlayerOfRoundJob.soundtrackPath ?? defaultFootballSoundtrack
      : samplePlayerOfRoundJob.soundtrackPath ?? defaultFootballSoundtrack,
  soundtrackVolume:
    footballPlayerOfRoundJob.template === 'player-of-round'
      ? footballPlayerOfRoundJob.soundtrackVolume ?? 0.2
      : samplePlayerOfRoundJob.soundtrackVolume ?? 0.2,
  voiceoverPath:
    footballPlayerOfRoundJob.template === 'player-of-round'
      ? footballPlayerOfRoundJob.voiceoverPath
      : samplePlayerOfRoundJob.voiceoverPath,
  introTitle:
    footballPlayerOfRoundJob.template === 'player-of-round'
      ? footballPlayerOfRoundJob.introTitle
      : samplePlayerOfRoundJob.introTitle,
  introSubtitle:
    footballPlayerOfRoundJob.template === 'player-of-round'
      ? footballPlayerOfRoundJob.introSubtitle
      : samplePlayerOfRoundJob.introSubtitle,
  hookText:
    footballPlayerOfRoundJob.template === 'player-of-round'
      ? footballPlayerOfRoundJob.hookText
      : samplePlayerOfRoundJob.hookText,
  coldOpenData:
    footballPlayerOfRoundJob.template === 'player-of-round'
      ? footballPlayerOfRoundJob.coldOpenData
      : samplePlayerOfRoundJob.coldOpenData,
  ctaText:
    footballPlayerOfRoundJob.template === 'player-of-round'
      ? footballPlayerOfRoundJob.ctaText
      : samplePlayerOfRoundJob.ctaText,
};

const championshipPaceProps = {
  leagueName:
    footballChampionshipPaceJob.template === 'championship-pace' &&
    footballChampionshipPaceJob.leagueName
      ? footballChampionshipPaceJob.leagueName
      : sampleChampionshipPaceJob.leagueName,
  titleLabel:
    footballChampionshipPaceJob.template === 'championship-pace' &&
    footballChampionshipPaceJob.titleLabel
      ? footballChampionshipPaceJob.titleLabel
      : sampleChampionshipPaceJob.titleLabel,
  subtitleLabel:
    footballChampionshipPaceJob.template === 'championship-pace' &&
    footballChampionshipPaceJob.subtitleLabel
      ? footballChampionshipPaceJob.subtitleLabel
      : sampleChampionshipPaceJob.subtitleLabel,
  benchmarkPercentage:
    footballChampionshipPaceJob.template === 'championship-pace' &&
    typeof footballChampionshipPaceJob.benchmarkPercentage === 'number'
      ? footballChampionshipPaceJob.benchmarkPercentage
      : sampleChampionshipPaceJob.benchmarkPercentage,
  benchmarkLabel:
    footballChampionshipPaceJob.template === 'championship-pace' &&
    footballChampionshipPaceJob.benchmarkLabel
      ? footballChampionshipPaceJob.benchmarkLabel
      : sampleChampionshipPaceJob.benchmarkLabel,
  noteLabel:
    footballChampionshipPaceJob.template === 'championship-pace'
      ? footballChampionshipPaceJob.noteLabel
      : sampleChampionshipPaceJob.noteLabel,
  entries:
    footballChampionshipPaceJob.template === 'championship-pace' &&
    Array.isArray(footballChampionshipPaceJob.entries)
      ? footballChampionshipPaceJob.entries
      : sampleChampionshipPaceJob.entries,
  leagueConfig:
    footballChampionshipPaceJob.template === 'championship-pace'
      ? footballChampionshipPaceJob.leagueConfig
      : sampleChampionshipPaceJob.leagueConfig,
  brandName: footballChampionshipPaceJob.brandName ?? sampleChampionshipPaceJob.brandName,
  brandLogoPath:
    footballChampionshipPaceJob.template === 'championship-pace'
      ? footballChampionshipPaceJob.brandLogoPath
      : sampleChampionshipPaceJob.brandLogoPath,
  soundtrackPath:
    footballChampionshipPaceJob.template === 'championship-pace'
      ? footballChampionshipPaceJob.soundtrackPath ?? defaultFootballSoundtrack
      : sampleChampionshipPaceJob.soundtrackPath ?? defaultFootballSoundtrack,
  soundtrackVolume:
    footballChampionshipPaceJob.template === 'championship-pace'
      ? footballChampionshipPaceJob.soundtrackVolume ?? 0.2
      : sampleChampionshipPaceJob.soundtrackVolume ?? 0.2,
  voiceoverPath:
    footballChampionshipPaceJob.template === 'championship-pace'
      ? footballChampionshipPaceJob.voiceoverPath
      : sampleChampionshipPaceJob.voiceoverPath,
  introTitle:
    footballChampionshipPaceJob.template === 'championship-pace'
      ? footballChampionshipPaceJob.introTitle
      : sampleChampionshipPaceJob.introTitle,
  introSubtitle:
    footballChampionshipPaceJob.template === 'championship-pace'
      ? footballChampionshipPaceJob.introSubtitle
      : sampleChampionshipPaceJob.introSubtitle,
  hookText:
    footballChampionshipPaceJob.template === 'championship-pace'
      ? footballChampionshipPaceJob.hookText
      : sampleChampionshipPaceJob.hookText,
  coldOpenData:
    footballChampionshipPaceJob.template === 'championship-pace'
      ? footballChampionshipPaceJob.coldOpenData
      : sampleChampionshipPaceJob.coldOpenData,
  ctaText:
    footballChampionshipPaceJob.template === 'championship-pace'
      ? footballChampionshipPaceJob.ctaText
      : sampleChampionshipPaceJob.ctaText,
};

const relegationLineProps = {
  leagueName:
    footballRelegationLineJob.template === 'relegation-line' &&
    footballRelegationLineJob.leagueName
      ? footballRelegationLineJob.leagueName
      : sampleRelegationLineJob.leagueName,
  titleLabel:
    footballRelegationLineJob.template === 'relegation-line' &&
    footballRelegationLineJob.titleLabel
      ? footballRelegationLineJob.titleLabel
      : sampleRelegationLineJob.titleLabel,
  subtitleLabel:
    footballRelegationLineJob.template === 'relegation-line' &&
    footballRelegationLineJob.subtitleLabel
      ? footballRelegationLineJob.subtitleLabel
      : sampleRelegationLineJob.subtitleLabel,
  benchmarkPercentage:
    footballRelegationLineJob.template === 'relegation-line' &&
    typeof footballRelegationLineJob.benchmarkPercentage === 'number'
      ? footballRelegationLineJob.benchmarkPercentage
      : sampleRelegationLineJob.benchmarkPercentage,
  benchmarkLabel:
    footballRelegationLineJob.template === 'relegation-line' &&
    footballRelegationLineJob.benchmarkLabel
      ? footballRelegationLineJob.benchmarkLabel
      : sampleRelegationLineJob.benchmarkLabel,
  noteLabel:
    footballRelegationLineJob.template === 'relegation-line'
      ? footballRelegationLineJob.noteLabel
      : sampleRelegationLineJob.noteLabel,
  entries:
    footballRelegationLineJob.template === 'relegation-line' &&
    Array.isArray(footballRelegationLineJob.entries)
      ? footballRelegationLineJob.entries
      : sampleRelegationLineJob.entries,
  leagueConfig:
    footballRelegationLineJob.template === 'relegation-line'
      ? footballRelegationLineJob.leagueConfig
      : sampleRelegationLineJob.leagueConfig,
  brandName: footballRelegationLineJob.brandName ?? sampleRelegationLineJob.brandName,
  brandLogoPath:
    footballRelegationLineJob.template === 'relegation-line'
      ? footballRelegationLineJob.brandLogoPath
      : sampleRelegationLineJob.brandLogoPath,
  soundtrackPath:
    footballRelegationLineJob.template === 'relegation-line'
      ? footballRelegationLineJob.soundtrackPath ?? defaultFootballSoundtrack
      : sampleRelegationLineJob.soundtrackPath ?? defaultFootballSoundtrack,
  soundtrackVolume:
    footballRelegationLineJob.template === 'relegation-line'
      ? footballRelegationLineJob.soundtrackVolume ?? 0.2
      : sampleRelegationLineJob.soundtrackVolume ?? 0.2,
  voiceoverPath:
    footballRelegationLineJob.template === 'relegation-line'
      ? footballRelegationLineJob.voiceoverPath
      : sampleRelegationLineJob.voiceoverPath,
  introTitle:
    footballRelegationLineJob.template === 'relegation-line'
      ? footballRelegationLineJob.introTitle
      : sampleRelegationLineJob.introTitle,
  introSubtitle:
    footballRelegationLineJob.template === 'relegation-line'
      ? footballRelegationLineJob.introSubtitle
      : sampleRelegationLineJob.introSubtitle,
  hookText:
    footballRelegationLineJob.template === 'relegation-line'
      ? footballRelegationLineJob.hookText
      : sampleRelegationLineJob.hookText,
  coldOpenData:
    footballRelegationLineJob.template === 'relegation-line'
      ? footballRelegationLineJob.coldOpenData
      : sampleRelegationLineJob.coldOpenData,
  ctaText:
    footballRelegationLineJob.template === 'relegation-line'
      ? footballRelegationLineJob.ctaText
      : sampleRelegationLineJob.ctaText,
};

const continentalGroupsProps = {
  leagueId:
    footballContinentalGroupsJob.template === 'continental-groups-standings' &&
    footballContinentalGroupsJob.leagueId
      ? footballContinentalGroupsJob.leagueId
      : sampleContinentalGroupsJob.leagueId,
  leagueName:
    footballContinentalGroupsJob.template === 'continental-groups-standings' &&
    footballContinentalGroupsJob.leagueName
      ? footballContinentalGroupsJob.leagueName
      : sampleContinentalGroupsJob.leagueName,
  languageProfile:
    footballContinentalGroupsJob.template === 'continental-groups-standings' &&
    footballContinentalGroupsJob.languageProfile
      ? footballContinentalGroupsJob.languageProfile
      : sampleContinentalGroupsJob.languageProfile,
  titleLabel:
    footballContinentalGroupsJob.template === 'continental-groups-standings' &&
    footballContinentalGroupsJob.titleLabel
      ? footballContinentalGroupsJob.titleLabel
      : sampleContinentalGroupsJob.titleLabel,
  subtitleLabel:
    footballContinentalGroupsJob.template === 'continental-groups-standings' &&
    footballContinentalGroupsJob.subtitleLabel
      ? footballContinentalGroupsJob.subtitleLabel
      : sampleContinentalGroupsJob.subtitleLabel,
  tableLabels:
    footballContinentalGroupsJob.template === 'continental-groups-standings' &&
    footballContinentalGroupsJob.tableLabels
      ? footballContinentalGroupsJob.tableLabels
      : sampleContinentalGroupsJob.tableLabels,
  groups:
    footballContinentalGroupsJob.template === 'continental-groups-standings' &&
    Array.isArray(footballContinentalGroupsJob.groups)
      ? footballContinentalGroupsJob.groups
      : sampleContinentalGroupsJob.groups,
  leagueConfig:
    footballContinentalGroupsJob.template === 'continental-groups-standings'
      ? footballContinentalGroupsJob.leagueConfig
      : sampleContinentalGroupsJob.leagueConfig,
  brandName: footballContinentalGroupsJob.brandName ?? sampleContinentalGroupsJob.brandName,
  brandLogoPath:
    footballContinentalGroupsJob.template === 'continental-groups-standings'
      ? footballContinentalGroupsJob.brandLogoPath
      : sampleContinentalGroupsJob.brandLogoPath,
  soundtrackPath:
    footballContinentalGroupsJob.template === 'continental-groups-standings'
      ? footballContinentalGroupsJob.soundtrackPath ?? defaultFootballSoundtrack
      : sampleContinentalGroupsJob.soundtrackPath ?? defaultFootballSoundtrack,
  soundtrackVolume:
    footballContinentalGroupsJob.template === 'continental-groups-standings'
      ? footballContinentalGroupsJob.soundtrackVolume ?? 0.2
      : sampleContinentalGroupsJob.soundtrackVolume ?? 0.2,
  voiceoverPath:
    footballContinentalGroupsJob.template === 'continental-groups-standings'
      ? footballContinentalGroupsJob.voiceoverPath
      : sampleContinentalGroupsJob.voiceoverPath,
  introTitle:
    footballContinentalGroupsJob.template === 'continental-groups-standings'
      ? footballContinentalGroupsJob.introTitle
      : sampleContinentalGroupsJob.introTitle,
  introSubtitle:
    footballContinentalGroupsJob.template === 'continental-groups-standings'
      ? footballContinentalGroupsJob.introSubtitle
      : sampleContinentalGroupsJob.introSubtitle,
  hookText:
    footballContinentalGroupsJob.template === 'continental-groups-standings'
      ? footballContinentalGroupsJob.hookText
      : sampleContinentalGroupsJob.hookText,
  coldOpenData:
    footballContinentalGroupsJob.template === 'continental-groups-standings'
      ? footballContinentalGroupsJob.coldOpenData
      : sampleContinentalGroupsJob.coldOpenData,
  ctaText:
    footballContinentalGroupsJob.template === 'continental-groups-standings'
      ? footballContinentalGroupsJob.ctaText
      : sampleContinentalGroupsJob.ctaText,
};

const isWorldCupGroupJob = footballWorldCupGroupJob.template === 'world-cup-group-standings';

const tierlistFallback = footballTierlistJobJson as TierlistVideoJob;
const tierlistProps = {
  channelProfile:
    footballTierlistJob.template === 'tierlist' && footballTierlistJob.channelProfile
      ? footballTierlistJob.channelProfile
      : tierlistFallback.channelProfile,
  leagueName:
    footballTierlistJob.template === 'tierlist' && footballTierlistJob.leagueName
      ? footballTierlistJob.leagueName
      : tierlistFallback.leagueName,
  titleLabel:
    footballTierlistJob.template === 'tierlist' && footballTierlistJob.titleLabel
      ? footballTierlistJob.titleLabel
      : tierlistFallback.titleLabel,
  subtitleLabel:
    footballTierlistJob.template === 'tierlist' && footballTierlistJob.subtitleLabel
      ? footballTierlistJob.subtitleLabel
      : tierlistFallback.subtitleLabel,
  topScorerPrediction:
    footballTierlistJob.template === 'tierlist'
      ? footballTierlistJob.topScorerPrediction
      : tierlistFallback.topScorerPrediction,
  bestPlayerPrediction:
    footballTierlistJob.template === 'tierlist'
      ? footballTierlistJob.bestPlayerPrediction
      : tierlistFallback.bestPlayerPrediction,
  tiers:
    footballTierlistJob.template === 'tierlist' && Array.isArray(footballTierlistJob.tiers)
      ? footballTierlistJob.tiers
      : tierlistFallback.tiers,
  leagueConfig:
    footballTierlistJob.template === 'tierlist'
      ? footballTierlistJob.leagueConfig
      : tierlistFallback.leagueConfig,
  brandName: footballTierlistJob.brandName ?? tierlistFallback.brandName,
  brandLogoPath:
    footballTierlistJob.template === 'tierlist'
      ? footballTierlistJob.brandLogoPath ?? defaultFootballBrandLogo
      : tierlistFallback.brandLogoPath ?? defaultFootballBrandLogo,
  soundtrackPath:
    footballTierlistJob.template === 'tierlist'
      ? footballTierlistJob.soundtrackPath ?? defaultFootballSoundtrack
      : tierlistFallback.soundtrackPath ?? defaultFootballSoundtrack,
  soundtrackVolume:
    footballTierlistJob.template === 'tierlist'
      ? footballTierlistJob.soundtrackVolume ?? 0.2
      : tierlistFallback.soundtrackVolume ?? 0.2,
  voiceoverPath:
    footballTierlistJob.template === 'tierlist'
      ? footballTierlistJob.voiceoverPath
      : tierlistFallback.voiceoverPath,
  introTitle:
    footballTierlistJob.template === 'tierlist'
      ? footballTierlistJob.introTitle
      : tierlistFallback.introTitle,
  introSubtitle:
    footballTierlistJob.template === 'tierlist'
      ? footballTierlistJob.introSubtitle
      : tierlistFallback.introSubtitle,
  hookText:
    footballTierlistJob.template === 'tierlist'
      ? footballTierlistJob.hookText
      : tierlistFallback.hookText,
  coldOpenData:
    footballTierlistJob.template === 'tierlist'
      ? footballTierlistJob.coldOpenData
      : tierlistFallback.coldOpenData,
  ctaText:
    footballTierlistJob.template === 'tierlist'
      ? footballTierlistJob.ctaText
      : tierlistFallback.ctaText,
};

const worldCupProps = {
  languageProfile:
    isWorldCupGroupJob && footballWorldCupGroupJob.languageProfile
      ? footballWorldCupGroupJob.languageProfile
      : sampleWorldCupGroupJob.languageProfile,
  titleLabel:
    isWorldCupGroupJob && footballWorldCupGroupJob.titleLabel
      ? footballWorldCupGroupJob.titleLabel
      : sampleWorldCupGroupJob.titleLabel,
  groupLabel:
    isWorldCupGroupJob && footballWorldCupGroupJob.groupLabel
      ? footballWorldCupGroupJob.groupLabel
      : sampleWorldCupGroupJob.groupLabel,
  tableLabels:
    isWorldCupGroupJob && footballWorldCupGroupJob.tableLabels
      ? footballWorldCupGroupJob.tableLabels
      : sampleWorldCupGroupJob.tableLabels,
  nextMatchesLabel:
    isWorldCupGroupJob && footballWorldCupGroupJob.nextMatchesLabel
      ? footballWorldCupGroupJob.nextMatchesLabel
      : sampleWorldCupGroupJob.nextMatchesLabel,
  lastResultsLabel:
    isWorldCupGroupJob && footballWorldCupGroupJob.lastResultsLabel
      ? footballWorldCupGroupJob.lastResultsLabel
      : sampleWorldCupGroupJob.lastResultsLabel,
  groupMatchSectionMode:
    isWorldCupGroupJob && footballWorldCupGroupJob.groupMatchSectionMode
      ? footballWorldCupGroupJob.groupMatchSectionMode
      : sampleWorldCupGroupJob.groupMatchSectionMode,
  ctaText:
    isWorldCupGroupJob && footballWorldCupGroupJob.ctaText
      ? footballWorldCupGroupJob.ctaText
      : sampleWorldCupGroupJob.ctaText,
  rows:
    isWorldCupGroupJob && Array.isArray(footballWorldCupGroupJob.rows)
      ? footballWorldCupGroupJob.rows
      : sampleWorldCupGroupJob.rows,
  nextMatches:
    isWorldCupGroupJob && Array.isArray(footballWorldCupGroupJob.nextMatches)
      ? footballWorldCupGroupJob.nextMatches
      : isWorldCupGroupJob
        ? []
        : sampleWorldCupGroupJob.nextMatches,
  lastResults:
    isWorldCupGroupJob && Array.isArray(footballWorldCupGroupJob.lastResults)
      ? footballWorldCupGroupJob.lastResults
      : isWorldCupGroupJob
        ? []
        : sampleWorldCupGroupJob.lastResults,
  brandName: footballWorldCupGroupJob.brandName ?? sampleWorldCupGroupJob.brandName,
  brandLogoPath:
    footballWorldCupGroupJob.template === 'world-cup-group-standings'
      ? footballWorldCupGroupJob.brandLogoPath ?? defaultFootballBrandLogo
      : sampleWorldCupGroupJob.brandLogoPath ?? defaultFootballBrandLogo,
  soundtrackPath:
    footballWorldCupGroupJob.template === 'world-cup-group-standings'
      ? footballWorldCupGroupJob.soundtrackPath ?? defaultFootballSoundtrack
      : sampleWorldCupGroupJob.soundtrackPath ?? defaultFootballSoundtrack,
  soundtrackVolume:
    footballWorldCupGroupJob.template === 'world-cup-group-standings'
      ? footballWorldCupGroupJob.soundtrackVolume ?? 0.2
      : sampleWorldCupGroupJob.soundtrackVolume ?? 0.2,
  voiceoverPath:
    footballWorldCupGroupJob.template === 'world-cup-group-standings'
      ? footballWorldCupGroupJob.voiceoverPath
      : sampleWorldCupGroupJob.voiceoverPath,
  introTitle:
    footballWorldCupGroupJob.template === 'world-cup-group-standings'
      ? footballWorldCupGroupJob.introTitle
      : sampleWorldCupGroupJob.introTitle,
  introSubtitle:
    footballWorldCupGroupJob.template === 'world-cup-group-standings'
      ? footballWorldCupGroupJob.introSubtitle
      : sampleWorldCupGroupJob.introSubtitle,
  hookText:
    footballWorldCupGroupJob.template === 'world-cup-group-standings'
      ? footballWorldCupGroupJob.hookText
      : sampleWorldCupGroupJob.hookText,
  coldOpenData:
    footballWorldCupGroupJob.template === 'world-cup-group-standings'
      ? footballWorldCupGroupJob.coldOpenData
      : sampleWorldCupGroupJob.coldOpenData,
};

const worldCupKnockoutProps = {
  titleLabel:
    footballWorldCupKnockoutJob.template === 'world-cup-knockout' &&
    footballWorldCupKnockoutJob.titleLabel
      ? footballWorldCupKnockoutJob.titleLabel
      : sampleWorldCupKnockoutJob.titleLabel,
  phaseLabel:
    footballWorldCupKnockoutJob.template === 'world-cup-knockout' &&
    footballWorldCupKnockoutJob.phaseLabel
      ? footballWorldCupKnockoutJob.phaseLabel
      : sampleWorldCupKnockoutJob.phaseLabel,
  ctaText:
    footballWorldCupKnockoutJob.template === 'world-cup-knockout' &&
    footballWorldCupKnockoutJob.ctaText
      ? footballWorldCupKnockoutJob.ctaText
      : sampleWorldCupKnockoutJob.ctaText,
  matches:
    footballWorldCupKnockoutJob.template === 'world-cup-knockout' &&
    Array.isArray(footballWorldCupKnockoutJob.matches)
      ? footballWorldCupKnockoutJob.matches
      : sampleWorldCupKnockoutJob.matches,
  brandName: footballWorldCupKnockoutJob.brandName ?? sampleWorldCupKnockoutJob.brandName,
  brandLogoPath:
    footballWorldCupKnockoutJob.template === 'world-cup-knockout'
      ? footballWorldCupKnockoutJob.brandLogoPath ?? defaultFootballBrandLogo
      : sampleWorldCupKnockoutJob.brandLogoPath ?? defaultFootballBrandLogo,
  soundtrackPath:
    footballWorldCupKnockoutJob.template === 'world-cup-knockout'
      ? footballWorldCupKnockoutJob.soundtrackPath ?? defaultFootballSoundtrack
      : sampleWorldCupKnockoutJob.soundtrackPath ?? defaultFootballSoundtrack,
  soundtrackVolume:
    footballWorldCupKnockoutJob.template === 'world-cup-knockout'
      ? footballWorldCupKnockoutJob.soundtrackVolume ?? 0.2
      : sampleWorldCupKnockoutJob.soundtrackVolume ?? 0.2,
  voiceoverPath:
    footballWorldCupKnockoutJob.template === 'world-cup-knockout'
      ? footballWorldCupKnockoutJob.voiceoverPath
      : sampleWorldCupKnockoutJob.voiceoverPath,
  introTitle:
    footballWorldCupKnockoutJob.template === 'world-cup-knockout'
      ? footballWorldCupKnockoutJob.introTitle
      : sampleWorldCupKnockoutJob.introTitle,
  introSubtitle:
    footballWorldCupKnockoutJob.template === 'world-cup-knockout'
      ? footballWorldCupKnockoutJob.introSubtitle
      : sampleWorldCupKnockoutJob.introSubtitle,
  hookText:
    footballWorldCupKnockoutJob.template === 'world-cup-knockout'
      ? footballWorldCupKnockoutJob.hookText
      : sampleWorldCupKnockoutJob.hookText,
  coldOpenData:
    footballWorldCupKnockoutJob.template === 'world-cup-knockout'
      ? footballWorldCupKnockoutJob.coldOpenData
      : sampleWorldCupKnockoutJob.coldOpenData,
};

const FOOTBALL_DURATION_IN_FRAMES = 270;
const FOOTBALL_LONG_DURATION_IN_FRAMES =
  footballPredictionsLongJob.template === 'predictions-long' &&
  typeof footballPredictionsLongJob.durationInFrames === 'number'
    ? Math.max(300, footballPredictionsLongJob.durationInFrames)
    : 900;
const FOOTBALL_ROUND_SUMMARY_LONG_DURATION_IN_FRAMES =
  footballRoundSummaryLongJob.template === 'round-summary-long' &&
  typeof footballRoundSummaryLongJob.durationInFrames === 'number'
    ? Math.max(300, footballRoundSummaryLongJob.durationInFrames)
    : 900;

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="FootballResultsShort"
        component={FootballFixturesComposition}
        durationInFrames={FOOTBALL_DURATION_IN_FRAMES}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={resultsProps}
      />
      <Composition
        id="FootballNextGamesShort"
        component={FootballFixturesComposition}
        durationInFrames={FOOTBALL_DURATION_IN_FRAMES}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={nextGamesProps}
      />
      <Composition
        id="FootballPredictionsShort"
        component={FootballFixturesComposition}
        durationInFrames={FOOTBALL_DURATION_IN_FRAMES}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={predictionsProps}
      />
      <Composition
        id="FootballPredictionsLong"
        component={FootballPredictionsLongComposition}
        durationInFrames={FOOTBALL_LONG_DURATION_IN_FRAMES}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={predictionsLongProps}
      />
      <Composition
        id="FootballRoundSummaryLong"
        component={FootballRoundSummaryLongComposition}
        durationInFrames={FOOTBALL_ROUND_SUMMARY_LONG_DURATION_IN_FRAMES}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={roundSummaryLongProps}
      />
      <Composition
        id="FootballThumbnailStill"
        component={FootballThumbnailComposition}
        durationInFrames={1}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{job: thumbnailJob}}
      />
      <Composition
        id="FootballStandingsShort"
        component={FootballStandingsComposition}
        durationInFrames={FOOTBALL_DURATION_IN_FRAMES}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={standingsProps}
      />
      <Composition
        id="FootballSeasonFinalVerdictShort"
        component={FootballSeasonFinalVerdictComposition}
        durationInFrames={FOOTBALL_DURATION_IN_FRAMES}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={seasonFinalVerdictProps}
      />
      <Composition
        id="FootballChampionFinalShort"
        component={FootballChampionFinalComposition}
        durationInFrames={FOOTBALL_DURATION_IN_FRAMES}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={championFinalProps}
      />
      <Composition
        id="FootballTopScorersShort"
        component={FootballTopScorersComposition}
        durationInFrames={FOOTBALL_DURATION_IN_FRAMES}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={topScorersProps}
      />
      <Composition
        id="FootballPlayerOfRoundShort"
        component={FootballPlayerOfRoundComposition}
        durationInFrames={FOOTBALL_DURATION_IN_FRAMES}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={playerOfRoundProps}
      />
      <Composition
        id="FootballChampionshipPaceShort"
        component={FootballPaceComposition}
        durationInFrames={FOOTBALL_DURATION_IN_FRAMES}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          ...championshipPaceProps,
          variant: 'championship',
        }}
      />
      <Composition
        id="FootballRelegationLineShort"
        component={FootballPaceComposition}
        durationInFrames={FOOTBALL_DURATION_IN_FRAMES}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          ...relegationLineProps,
          variant: 'relegation',
        }}
      />
      <Composition
        id="FootballContinentalGroupsShort"
        component={FootballContinentalGroupsComposition}
        durationInFrames={FOOTBALL_DURATION_IN_FRAMES}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={continentalGroupsProps}
      />
      <Composition
        id="FootballTierlistShort"
        component={FootballTierlistComposition}
        durationInFrames={FOOTBALL_DURATION_IN_FRAMES}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={tierlistProps}
      />
      <Composition
        id="FootballWorldCupGroupShort"
        component={FootballWorldCupGroupComposition}
        durationInFrames={FOOTBALL_DURATION_IN_FRAMES}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={worldCupProps}
      />
      <Composition
        id="FootballWorldCupKnockoutShort"
        component={FootballWorldCupKnockoutComposition}
        durationInFrames={FOOTBALL_DURATION_IN_FRAMES}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={worldCupKnockoutProps}
      />
    </>
  );
};
