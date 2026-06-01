export type Sport = 'football';

export type FootballLanguageProfile = 'pt-br' | 'en';
export type FootballChannelProfile = 'pt' | 'en';

export type FootballVideoTemplate =
  | 'results'
  | 'next-games'
  | 'predictions'
  | 'predictions-long'
  | 'round-summary-long'
  | 'standings'
  | 'top-scorers'
  | 'player-of-round'
  | 'season-final-verdict'
  | 'champion-final'
  | 'championship-pace'
  | 'relegation-line'
  | 'tierlist'
  | 'continental-groups-standings'
  | 'world-cup-group-standings'
  | 'world-cup-knockout';

export type VideoTemplate = FootballVideoTemplate;

export type FootballThumbnailPreset = 'matchup' | 'result' | 'table-story' | 'champion';
export type FootballThumbnailModel =
  | 'model-1'
  | 'model-2'
  | 'model-3'
  | 'model-4'
  | 'model-5'
  | 'model-6'
  | 'model-7'
  | 'model-8';

export type TeamBadge = {
  label: string;
  logoPath?: string;
  imagePath?: string;
  accentColor?: string;
  sublabel?: string;
};

export type FixtureCard = {
  fixtureId?: number;
  fixtureDateKey?: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  predictionSource?: 'api' | 'manual';
  homeEliminated?: boolean;
  awayEliminated?: boolean;
  hasPenalties?: boolean;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
  homeBadge: TeamBadge;
  awayBadge: TeamBadge;
};

export type StandingRow = {
  rank: number;
  team: string;
  played: number;
  points: number;
  goalDifference: number;
  form?: string;
  badge: TeamBadge;
};

export type FootballColdOpenMatchRow = {
  left: string;
  center: string;
  right: string;
};

export type FootballColdOpenTableRow = {
  rank: string | number;
  club: string;
  pts: string | number;
};

export type FootballColdOpenData = {
  matchRows?: FootballColdOpenMatchRow[];
  tableRows?: FootballColdOpenTableRow[];
};

export type StandingsZoneConfig = {
  key: string;
  label: string;
  start: number;
  end: number;
  fill: string;
  accent?: string;
  textColor?: string;
};

export type StandingsSafeAreaConfig = {
  left: number;
  right: number;
};

export type StandingsLayoutConfig = {
  safeArea: StandingsSafeAreaConfig;
  zones: StandingsZoneConfig[];
};

export type PaceTemplateConfig = {
  benchmarkPercentage: number;
  benchmarkLabel: string;
  entryCount?: number;
  safeRowsAbove?: number;
  maxRows?: number;
};

export type PaceLayoutConfig = {
  championship: PaceTemplateConfig;
  relegation: PaceTemplateConfig;
};

export type LeagueConfig = {
  leagueId: number;
  leagueName?: string;
  accentColor?: string;
  secondaryAccentColor?: string;
  standings?: StandingsLayoutConfig;
  pace?: PaceLayoutConfig;
};

type BaseVideoJob = {
  sport: Sport;
  brandName: string;
  brandLogoPath?: string;
  backgroundImagePath?: string;
  soundtrackPath?: string;
  soundtrackLabel?: string;
  soundtrackVolume?: number;
  outputName: string;
  durationInFrames: number;
  dataSource?: 'api' | 'sample';
  warnings?: string[];
};

type FootballBaseVideoJob = BaseVideoJob & {
  sport: 'football';
  template: FootballVideoTemplate;
  leagueId: number;
  season: number;
  leagueName: string;
  channelProfile?: FootballChannelProfile;
  languageProfile?: FootballLanguageProfile;
  leagueConfig?: LeagueConfig;
  ctaText?: string;
  introTitle?: string;
  introSubtitle?: string;
  hookText?: string;
  coldOpenData?: FootballColdOpenData;
  voiceoverText?: string;
  voiceoverEnabled?: boolean;
  voiceoverPath?: string;
  voiceoverLabel?: string;
};

export type ResultsVideoJob = FootballBaseVideoJob & {
  template: 'results' | 'next-games' | 'predictions';
  compositionId: 'FootballResultsShort' | 'FootballNextGamesShort' | 'FootballPredictionsShort';
  round: string;
  matchDate?: string;
  matchDates?: string[];
  roundLabel: string;
  fixtures: FixtureCard[];
};

export type LongformPredictionMatch = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  predictedScore: string;
  homeScore: number;
  awayScore: number;
  voiceover: string;
  voiceoverPath?: string;
  durationInFrames: number;
  homeBadge: TeamBadge;
  awayBadge: TeamBadge;
};

export type FootballPredictionsLongVideoJob = FootballBaseVideoJob & {
  template: 'predictions-long';
  compositionId: 'FootballPredictionsLong';
  title: string;
  roundLabel: string;
  openingLines?: string[];
  matches: LongformPredictionMatch[];
  introDurationInFrames: number;
  outroDurationInFrames: number;
  transitionDurationInFrames: number;
  disclaimer: string;
};

export type RoundSummaryEvent = {
  minute: number;
  extraMinute?: number | null;
  team: string;
  player: string;
  assist?: string | null;
  type: 'goal' | 'card' | 'subst' | 'var' | 'penalty' | 'other';
  detail: string;
  side: 'home' | 'away';
};

export type RoundSummaryStatistic = {
  label: string;
  homeValue: string;
  awayValue: string;
};

export type RoundSummaryMatch = {
  id: string;
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  fixtureDateLabel?: string;
  venueLabel?: string;
  statusLabel?: string;
  voiceover: string;
  voiceoverPath?: string;
  durationInFrames: number;
  homeBadge: TeamBadge;
  awayBadge: TeamBadge;
  events: RoundSummaryEvent[];
  keyStats: RoundSummaryStatistic[];
  highlights: string[];
};

export type FootballRoundSummaryLongVideoJob = FootballBaseVideoJob & {
  template: 'round-summary-long';
  compositionId: 'FootballRoundSummaryLong';
  title: string;
  roundLabel: string;
  openingLines?: string[];
  matches: RoundSummaryMatch[];
  introDurationInFrames: number;
  outroDurationInFrames: number;
  transitionDurationInFrames: number;
  disclaimer: string;
};

export type StandingsVideoJob = FootballBaseVideoJob & {
  template: 'standings';
  compositionId: 'FootballStandingsShort';
  standingsLabel: string;
  rows: StandingRow[];
};

export type SeasonFinalVerdictGroup = {
  key: string;
  label: string;
  accentColor: string;
  entries: StandingRow[];
};

export type SeasonFinalVerdictVideoJob = FootballBaseVideoJob & {
  template: 'season-final-verdict';
  compositionId: 'FootballSeasonFinalVerdictShort';
  titleLabel: string;
  subtitleLabel: string;
  champion: StandingRow;
  qualificationGroups: SeasonFinalVerdictGroup[];
  relegationGroup: SeasonFinalVerdictGroup;
};

export type ChampionFinalVideoJob = FootballBaseVideoJob & {
  template: 'champion-final';
  compositionId: 'FootballChampionFinalShort';
  championTeam: string;
  championBadge: TeamBadge;
  titleLabel: string;
  subtitleLabel: string;
  seasonLabel: string;
  finalFixture?: FixtureCard;
};

export type TopScorerEntry = {
  rank: number;
  playerName: string;
  team: string;
  teamShort: string;
  goals: number;
  assists?: number | null;
  badge: TeamBadge;
};

export type TopScorersVideoJob = FootballBaseVideoJob & {
  template: 'top-scorers';
  compositionId: 'FootballTopScorersShort';
  titleLabel: string;
  subtitleLabel: string;
  entries: TopScorerEntry[];
};

export type PlayerOfRoundEntry = {
  rank: number;
  playerName: string;
  team: string;
  teamShort: string;
  position?: string;
  rating: number;
  goals: number;
  assists: number;
  shotsOn: number;
  keyPasses: number;
  minutes: number;
  badge: TeamBadge;
};

export type PlayerOfRoundVideoJob = FootballBaseVideoJob & {
  template: 'player-of-round';
  compositionId: 'FootballPlayerOfRoundShort';
  round: string;
  matchDate?: string;
  matchDates?: string[];
  titleLabel: string;
  subtitleLabel: string;
  entries: PlayerOfRoundEntry[];
};

export type PaceEntry = {
  rank: number;
  team: string;
  played: number;
  points: number;
  percentage: number;
  hasGameInHand?: boolean;
  badge: TeamBadge;
};

export type PaceVideoJob = FootballBaseVideoJob & {
  template: 'championship-pace' | 'relegation-line';
  compositionId: 'FootballChampionshipPaceShort' | 'FootballRelegationLineShort';
  titleLabel: string;
  subtitleLabel: string;
  benchmarkPercentage: number;
  benchmarkLabel: string;
  noteLabel?: string;
  entries: PaceEntry[];
};

export type ContinentalGroupStandingRow = {
  rank: number;
  team: string;
  goalDifference: number;
  points: number;
  badge: TeamBadge;
};

export type ContinentalGroupStandingsGroup = {
  groupKey: string;
  groupLabel: string;
  rows: ContinentalGroupStandingRow[];
};

export type ContinentalGroupsStandingsVideoJob = FootballBaseVideoJob & {
  template: 'continental-groups-standings';
  compositionId: 'FootballContinentalGroupsShort';
  titleLabel: string;
  subtitleLabel: string;
  tableLabels: {
    pos: string;
    team: string;
    gd: string;
    pts: string;
  };
  groups: ContinentalGroupStandingsGroup[];
};

export type TierlistEntry = {
  team: string;
  sourceTeam?: string;
  badge: TeamBadge;
};

export type TierlistGroup = {
  key:
    | 'champion'
    | 'favorites'
    | 'deep-run'
    | 'dark-horses'
    | 'group-stage-exit'
    | 'disappointment';
  label: string;
  accentColor: string;
  entries: TierlistEntry[];
};

export type TierlistVideoJob = FootballBaseVideoJob & {
  template: 'tierlist';
  compositionId: 'FootballTierlistShort';
  titleLabel: string;
  subtitleLabel: string;
  topScorerPrediction?: string;
  bestPlayerPrediction?: string;
  tiers: TierlistGroup[];
};

export type WorldCupGroupRow = {
  rank: number;
  team: string;
  goalDifference: number;
  points: number;
  badge: TeamBadge;
  qualifiesAsBestThird?: boolean;
};

export type WorldCupNextMatch = {
  homeTeam: string;
  awayTeam: string;
  homeBadge: TeamBadge;
  awayBadge: TeamBadge;
  dateLabel: string;
};

export type WorldCupGroupResult = {
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  homeBadge: TeamBadge;
  awayBadge: TeamBadge;
  dateLabel: string;
};

export type WorldCupGroupVideoJob = FootballBaseVideoJob & {
  template: 'world-cup-group-standings';
  compositionId: 'FootballWorldCupGroupShort';
  competitionName: string;
  groupLetter: string;
  titleLabel: string;
  groupLabel: string;
  tableLabels: {
    pos: string;
    team: string;
    gd: string;
    pts: string;
  };
  nextMatchesLabel: string;
  lastResultsLabel?: string;
  qualificationLegend?: {
    direct: string;
    bestThird: string;
  };
  groupMatchSectionMode?: 'next-only' | 'mixed' | 'results-only';
  ctaText: string;
  rows: WorldCupGroupRow[];
  nextMatches: WorldCupNextMatch[];
  lastResults?: WorldCupGroupResult[];
};

export type WorldCupKnockoutMatch = {
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  homeBadge: TeamBadge;
  awayBadge: TeamBadge;
  statusLabel: string;
  winner: 'home' | 'away' | 'none';
};

export type WorldCupKnockoutVideoJob = FootballBaseVideoJob & {
  template: 'world-cup-knockout';
  compositionId: 'FootballWorldCupKnockoutShort';
  titleLabel: string;
  phaseLabel: string;
  ctaText: string;
  matches: WorldCupKnockoutMatch[];
};

export type FootballThumbnailJob = {
  sport: 'football';
  template: 'thumbnail';
  compositionId: 'FootballThumbnailStill';
  channelProfile?: FootballChannelProfile;
  languageProfile?: FootballLanguageProfile;
  preset: FootballThumbnailPreset;
  thumbnailModel?: FootballThumbnailModel;
  brandName: string;
  brandLogoPath?: string;
  leagueName: string;
  headline: string;
  subheadline?: string;
  extraLabel?: string;
  outputName: string;
  accentColor?: string;
  secondaryAccentColor?: string;
  backgroundImagePath?: string;
  teamA: TeamBadge;
  teamB?: TeamBadge;
  teamC?: TeamBadge;
  teamD?: TeamBadge;
  teamE?: TeamBadge;
  teamF?: TeamBadge;
};

export type FootballVideoJob =
  | ResultsVideoJob
  | FootballPredictionsLongVideoJob
  | FootballRoundSummaryLongVideoJob
  | StandingsVideoJob
  | SeasonFinalVerdictVideoJob
  | ChampionFinalVideoJob
  | TopScorersVideoJob
  | PlayerOfRoundVideoJob
  | PaceVideoJob
  | TierlistVideoJob
  | ContinentalGroupsStandingsVideoJob
  | WorldCupGroupVideoJob
  | WorldCupKnockoutVideoJob;

export type VideoJob = FootballVideoJob;
