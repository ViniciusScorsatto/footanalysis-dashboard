export type HistoricalSourceMode = 'local-only' | 'cache-first' | 'openai-refresh';

export type HistoryWarning = {
  code: 'club-not-found' | 'invalid-record' | 'openai-response';
  message: string;
  context?: Record<string, string | number | boolean>;
};

export type HistoricalTeamBadge = {
  label: string;
  logoPath?: string;
  accentColor?: string;
};

export type HistoricalChampion = {
  year: number;
  clubId: string;
  clubName: string;
  country: string;
  runnerUp?: string;
  score?: string;
  notes?: string;
  badge?: HistoricalTeamBadge;
};

export type CompetitionHistory = {
  competitionId: string;
  competitionName: string;
  champions: HistoricalChampion[];
  warnings?: HistoryWarning[];
};

export type HistoryGeneratorOptions = {
  competitionId: string;
  competitionName: string;
  amount: number;
  sourceMode: HistoricalSourceMode;
};

export type HistoryGenerator = (options: HistoryGeneratorOptions) => Promise<CompetitionHistory>;

export type RawHistoricalChampion = {
  year: unknown;
  champion?: unknown;
  clubName?: unknown;
  country?: unknown;
  runnerUp?: unknown;
  score?: unknown;
  notes?: unknown;
};

export type RawCompetitionHistory = {
  competitionId?: unknown;
  competitionName?: unknown;
  champions?: unknown;
};

export type HistoricalClub = {
  clubId: string;
  clubName: string;
  country?: string;
  badge: HistoricalTeamBadge;
};
