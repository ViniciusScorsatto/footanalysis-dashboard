export {generateLastChampionsHistory} from './generators/lastChampions.js';
export {generateHistoricalChampions} from './datasource/openAiHistory.js';
export {getHistoricalClubByName} from './clubResolver.js';
export type {
  CompetitionHistory,
  HistoricalChampion,
  HistoricalClub,
  HistoricalSourceMode,
  HistoryGenerator,
  HistoryGeneratorOptions,
  HistoryWarning,
} from './types/index.js';
