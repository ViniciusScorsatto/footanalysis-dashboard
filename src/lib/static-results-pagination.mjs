export const STATIC_RESULTS_PAGE_SECONDS = 8;
export const STATIC_RESULTS_MAX_PER_PAGE = 12;

export function staticResultsPageCount(count) {
  return Math.max(1, Math.ceil(count / STATIC_RESULTS_MAX_PER_PAGE));
}

export function staticResultsPageRange(count, frame, fps = 30) {
  const pages = staticResultsPageCount(count);
  const page = Math.min(pages - 1, Math.max(0, Math.floor(frame / (STATIC_RESULTS_PAGE_SECONDS * fps))));
  // Balanced contiguous pages preserve fixture order without a nearly empty last page.
  const size = Math.floor(count / pages);
  const extra = count % pages;
  const start = page * size + Math.min(page, extra);
  return {page, pages, start, end: start + size + (page < extra ? 1 : 0)};
}

export function staticResultsDuration(count, fallback, fps = 30) {
  const pages = staticResultsPageCount(count);
  return pages > 1 ? pages * Math.round(STATIC_RESULTS_PAGE_SECONDS * fps) : fallback;
}
