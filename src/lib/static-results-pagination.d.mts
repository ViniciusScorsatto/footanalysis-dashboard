export const STATIC_RESULTS_PAGE_SECONDS: number;
export const STATIC_RESULTS_MAX_PER_PAGE: number;
export function staticResultsPageCount(count: number): number;
export function staticResultsPageRange(count: number, frame: number, fps?: number): {page: number; pages: number; start: number; end: number};
export function staticResultsDuration(count: number, fallback: number, fps?: number): number;
