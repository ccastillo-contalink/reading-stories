import test from 'node:test';
import assert from 'node:assert/strict';
import { createReadingProgress, HISTORY_KEY, accuracyPercent, formatReadingTime } from '../src/progress.mjs';
import { readingReward } from '../src/logic.mjs';

function memoryStorage() {
  const data = new Map();
  return {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key),
  };
}

test('refresh preserves completed stories, accuracy and time, but starts the reward at zero', () => {
  const storage = memoryStorage();
  const first = createReadingProgress({ storage });
  first.recordTime(1, 20 * 60000);
  for (let answer = 0; answer < 21; answer++) first.recordAnswer(1, true);
  first.recordAnswer(1, false);
  first.completeStory(1);
  const before = first.snapshot();
  assert.equal(readingReward(before.stats).televisionMinutes, 40);
  assert.equal(accuracyPercent(before.history.totals), 95.5);
  assert.equal(before.history.stories[1].completions, 1);
  assert.ok(before.history.stories[1].lastCompletedAt);

  const refreshed = createReadingProgress({ storage });
  assert.deepEqual(refreshed.snapshot().history, before.history);
  assert.deepEqual(refreshed.snapshot().stats, { activeMs: 0, correct: 0, incorrect: 0 });
  assert.equal(readingReward(refreshed.snapshot().stats).televisionMinutes, 0);
  refreshed.recordAnswer(2, true);
  refreshed.recordTime(2, 60000);
  const next = refreshed.snapshot();
  assert.equal(readingReward(next.stats).televisionMinutes, 2);
  assert.equal(next.history.totals.correct, 22);
  assert.equal(next.history.totals.incorrect, 1);
  assert.equal(next.history.totals.activeMs, 21 * 60000);
  assert.equal(next.history.stories[1].activeMs, 20 * 60000);
  assert.equal(next.history.stories[2].activeMs, 60000);
  assert.equal(next.history.stories[2].completions, 0);
});

test('repeated readings keep one completed story and accumulate its results', () => {
  const storage = memoryStorage();
  const store = createReadingProgress({ storage });
  store.recordAnswer(3, true);
  store.completeStory(3);
  store.recordAnswer(3, false);
  store.completeStory(3);
  const history = createReadingProgress({ storage }).snapshot().history;
  assert.deepEqual(Object.keys(history.stories), ['3']);
  assert.equal(history.stories[3].completions, 2);
  assert.equal(history.stories[3].correct, 1);
  assert.equal(history.stories[3].incorrect, 1);
  assert.equal(accuracyPercent(history.stories[3]), 50);
});

test('an older summary migrates once into history without restoring the prize', () => {
  const storage = memoryStorage();
  const legacyStorage = memoryStorage();
  legacyStorage.setItem('bluey-reading-session-v1', JSON.stringify({ activeMs: 90000, correct: 8, incorrect: 2 }));
  const first = createReadingProgress({ storage, legacyStorage }).snapshot();
  assert.equal(first.history.totals.correct, 8);
  assert.equal(readingReward(first.stats).televisionMinutes, 0);
  assert.equal(legacyStorage.getItem('bluey-reading-session-v1'), null);
  const second = createReadingProgress({ storage, legacyStorage }).snapshot();
  assert.deepEqual(second.history, first.history);
  assert.deepEqual(second.stats, first.stats);
});

test('corrupt or unavailable storage does not stop the activity', () => {
  const storage = memoryStorage();
  storage.setItem(HISTORY_KEY, '{invalid');
  const recovered = createReadingProgress({ storage });
  recovered.recordAnswer(1, true);
  assert.equal(recovered.snapshot().history.totals.correct, 1);
  const blocked = createReadingProgress({ storage: { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } } });
  blocked.recordAnswer(1, true);
  blocked.recordAnswer(1, false);
  assert.equal(blocked.snapshot().stats.correct, 1);
  assert.equal(blocked.snapshot().history.totals.incorrect, 1);
  assert.equal(blocked.snapshot().persistenceAvailable, false);
});

test('invalid saved counters and unknown story ids are ignored', () => {
  const storage = memoryStorage();
  storage.setItem(HISTORY_KEY, JSON.stringify({ version: 1, totals: {activeMs:-1, correct:2, incorrect:1}, stories:{} }));
  const store = createReadingProgress({ storage });
  store.completeStory(41);
  store.recordAnswer(null, true);
  store.recordTime(1, NaN);
  assert.deepEqual(store.snapshot().history.totals, { activeMs:0, correct:0, incorrect:0 });
  assert.deepEqual(store.snapshot().history.stories, {});
});

test('saved changes from a second tab do not change this tab’s session prize', () => {
  const storage = memoryStorage();
  const a = createReadingProgress({ storage });
  const b = createReadingProgress({ storage });
  a.recordAnswer(1, true);
  b.recordAnswer(2, false);
  a.syncHistory();
  assert.deepEqual(a.snapshot().history.totals, {activeMs:0, correct:1, incorrect:1});
  assert.equal(a.snapshot().stats.correct, 1);
  assert.equal(a.snapshot().stats.incorrect, 0);
  assert.equal(b.snapshot().stats.correct, 0);
});

test('accuracy and total time have sensible empty, partial and long-session values', () => {
  assert.equal(accuracyPercent({ correct:0, incorrect:0 }), 0);
  assert.equal(accuracyPercent({ correct:2, incorrect:1 }), 66.7);
  assert.equal(formatReadingTime(59999), '0 min 59 s');
  assert.equal(formatReadingTime(60000), '1 min 00 s');
  assert.equal(formatReadingTime(3_661_000), '1 h 1 min 01 s');
});

test('a full storage quota keeps unsaved attempts in memory rather than reverting to old totals', () => {
  const storage = memoryStorage();
  const store = createReadingProgress({ storage });
  store.recordAnswer(1, true);
  storage.setItem = () => { throw Error('quota exceeded'); };
  store.recordAnswer(1, true);
  store.recordAnswer(1, false);
  assert.equal(store.snapshot().history.totals.correct, 2);
  assert.equal(store.snapshot().history.totals.incorrect, 1);
  assert.equal(store.snapshot().persistenceAvailable, false);
});
