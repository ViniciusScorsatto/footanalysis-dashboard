import type {ContinentalGroupsStandingsVideoJob} from '../lib/types';

export const sampleContinentalGroupsJob: ContinentalGroupsStandingsVideoJob = {
  sport: 'football',
  template: 'continental-groups-standings',
  compositionId: 'FootballContinentalGroupsShort',
  leagueId: 13,
  season: 2026,
  leagueName: 'Copa Libertadores 2026',
  languageProfile: 'pt-br',
  brandName: 'Foot Analysis',
  brandLogoPath: '/branding/foot-analysis-logo.png',
  outputName: 'copa-libertadores-2026-grupos-pt-br.mp4',
  durationInFrames: 270,
  dataSource: 'sample',
  titleLabel: 'Tabela dos Grupos',
  subtitleLabel: 'Fase de Grupos',
  tableLabels: {
    pos: 'Pos',
    team: 'Equipe',
    gd: 'SG',
    pts: 'Pts',
  },
  ctaText: 'Quem avança?',
  groups: [
    {
      groupKey: 'A',
      groupLabel: 'Grupo A',
      rows: [
        {rank: 1, team: 'River Plate', goalDifference: 4, points: 7, badge: {label: 'RP'}},
        {rank: 2, team: 'Barcelona SC', goalDifference: 1, points: 4, badge: {label: 'BSC'}},
        {rank: 3, team: 'Talleres', goalDifference: -1, points: 3, badge: {label: 'TAL'}},
        {rank: 4, team: 'Universitario', goalDifference: -4, points: 1, badge: {label: 'UNI'}},
      ],
    },
    {
      groupKey: 'B',
      groupLabel: 'Grupo B',
      rows: [
        {rank: 1, team: 'Palmeiras', goalDifference: 5, points: 9, badge: {label: 'PAL'}},
        {rank: 2, team: 'Bolívar', goalDifference: 2, points: 6, badge: {label: 'BOL'}},
        {rank: 3, team: 'Cerro Porteño', goalDifference: -2, points: 3, badge: {label: 'CP'}},
        {rank: 4, team: 'Sporting Cristal', goalDifference: -5, points: 0, badge: {label: 'SC'}},
      ],
    },
    {
      groupKey: 'C',
      groupLabel: 'Grupo C',
      rows: [
        {rank: 1, team: 'Cruzeiro', goalDifference: 3, points: 6, badge: {label: 'CRU'}},
        {rank: 2, team: 'LDU Quito', goalDifference: 1, points: 4, badge: {label: 'LDU'}},
        {rank: 3, team: 'Junior', goalDifference: 0, points: 4, badge: {label: 'JUN'}},
        {rank: 4, team: 'Deportes Tolima', goalDifference: -4, points: 1, badge: {label: 'TOL'}},
      ],
    },
    {
      groupKey: 'D',
      groupLabel: 'Grupo D',
      rows: [
        {rank: 1, team: 'Flamengo', goalDifference: 6, points: 9, badge: {label: 'FLA'}},
        {rank: 2, team: 'Millonarios', goalDifference: 1, points: 4, badge: {label: 'MIL'}},
        {rank: 3, team: 'Libertad', goalDifference: -1, points: 4, badge: {label: 'LIB'}},
        {rank: 4, team: 'The Strongest', goalDifference: -6, points: 0, badge: {label: 'TS'}},
      ],
    },
  ],
};
