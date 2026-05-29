import type {SeasonFinalVerdictVideoJob} from '../lib/types';

const sampleRows = [
  {rank: 1, team: 'Palmeiras', played: 38, points: 78, goalDifference: 34, badge: {label: 'PAL'}},
  {rank: 2, team: 'Flamengo', played: 38, points: 72, goalDifference: 28, badge: {label: 'FLA'}},
  {rank: 3, team: 'Fluminense', played: 38, points: 68, goalDifference: 21, badge: {label: 'FLU'}},
  {rank: 4, team: 'São Paulo', played: 38, points: 66, goalDifference: 18, badge: {label: 'SAO'}},
  {rank: 5, team: 'Bahia', played: 38, points: 62, goalDifference: 12, badge: {label: 'BAH'}},
  {rank: 6, team: 'Athletico-PR', played: 38, points: 58, goalDifference: 8, badge: {label: 'CAP'}},
  {rank: 7, team: 'Botafogo', played: 38, points: 56, goalDifference: 7, badge: {label: 'BOT'}},
  {rank: 8, team: 'Coritiba', played: 38, points: 54, goalDifference: 3, badge: {label: 'CFC'}},
  {rank: 9, team: 'Vitória', played: 38, points: 52, goalDifference: 1, badge: {label: 'VIT'}},
  {rank: 10, team: 'Vasco da Gama', played: 38, points: 50, goalDifference: 0, badge: {label: 'VAS'}},
  {rank: 11, team: 'RB Bragantino', played: 38, points: 49, goalDifference: -1, badge: {label: 'RBB'}},
  {rank: 17, team: 'Santos', played: 38, points: 39, goalDifference: -14, badge: {label: 'SAN'}},
  {rank: 18, team: 'Cruzeiro', played: 38, points: 36, goalDifference: -18, badge: {label: 'CRU'}},
  {rank: 19, team: 'Chapecoense', played: 38, points: 34, goalDifference: -24, badge: {label: 'CHA'}},
  {rank: 20, team: 'Remo', played: 38, points: 31, goalDifference: -29, badge: {label: 'REM'}},
];

export const sampleSeasonFinalVerdictJob: SeasonFinalVerdictVideoJob = {
  sport: 'football',
  template: 'season-final-verdict',
  compositionId: 'FootballSeasonFinalVerdictShort',
  leagueId: 71,
  season: 2026,
  leagueName: 'Brasileirão Série A 2026',
  channelProfile: 'pt',
  languageProfile: 'pt-br',
  brandName: 'Foot Analysis',
  brandLogoPath: '/branding/foot-analysis-logo.png',
  outputName: 'brasileirao-serie-a-2026-resumo-final.mp4',
  durationInFrames: 270,
  leagueConfig: {
    leagueId: 71,
    leagueName: 'Brasileirão Série A',
    accentColor: '#F0A500',
  },
  titleLabel: 'Resumo Final',
  subtitleLabel: 'Temporada 2026 Definida',
  champion: sampleRows[0],
  qualificationGroups: [
    {
      key: 'libertadores',
      label: 'Libertadores',
      accentColor: '#27AE60',
      entries: sampleRows.slice(1, 5),
    },
    {
      key: 'sul-americana',
      label: 'Sul-Americana',
      accentColor: '#1ABC9C',
      entries: sampleRows.slice(5, 11),
    },
  ],
  relegationGroup: {
    key: 'rebaixamento',
    label: 'Rebaixados',
    accentColor: '#E74C3C',
    entries: sampleRows.slice(-4),
  },
  ctaText: 'Seu time cumpriu o objetivo?',
};
