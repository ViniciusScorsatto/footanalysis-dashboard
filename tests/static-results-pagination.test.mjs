import {test} from 'node:test';
import assert from 'node:assert/strict';
import {staticResultsPageCount, staticResultsPageRange, staticResultsDuration} from '../src/lib/static-results-pagination.mjs';

for (const count of [0, 1, 12, 13, 18, 24, 25, 36]) {
  test(`${count} results: balanced pages preserve every match once`, () => {
    const pages = staticResultsPageCount(count);
    const matches = Array.from({length: count}, (_, i) => i);
    const displayed = [];
    const lengths = [];
    for (let page = 0; page < pages; page++) {
      const range = staticResultsPageRange(count, page * 240);
      assert.equal(range.page, page);
      const slice = matches.slice(range.start, range.end);
      assert.ok(slice.length <= 12);
      displayed.push(...slice);
      lengths.push(slice.length);
    }
    assert.deepEqual(displayed, matches);
    assert.ok(Math.max(...lengths) - Math.min(...lengths) <= 1);
    assert.equal(staticResultsDuration(count, 360), pages > 1 ? pages * 240 : 360);
  });
}

test('18 matches switch from 9 to 9 at exactly eight seconds', () => {
  assert.deepEqual(staticResultsPageRange(18, 239), {page: 0, pages: 2, start: 0, end: 9});
  assert.deepEqual(staticResultsPageRange(18, 240), {page: 1, pages: 2, start: 9, end: 18});
  assert.equal(staticResultsPageRange(18, 479).page, 1);
  assert.equal(staticResultsPageRange(18, 999).page, 1);
  assert.equal(staticResultsPageRange(18, 480, 60).page, 1);
  assert.equal(staticResultsDuration(18, 360, 60), 960);
});
