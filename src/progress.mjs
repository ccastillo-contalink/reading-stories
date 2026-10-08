export const HISTORY_KEY = 'bluey-reading-history-v1';
const LEGACY_SESSION_KEY = 'bluey-reading-session-v1';

const emptyStats = () => ({ activeMs: 0, correct: 0, incorrect: 0 });
const emptyHistory = () => ({ version: 1, totals: emptyStats(), stories: {} });
const validStory = id => Number.isInteger(id) && id >= 1 && id <= 40;
const validStats = stats => stats && Number.isFinite(stats.activeMs) && stats.activeMs >= 0 &&
  Number.isSafeInteger(stats.correct) && stats.correct >= 0 &&
  Number.isSafeInteger(stats.incorrect) && stats.incorrect >= 0;
const copyStats = ({ activeMs, correct, incorrect }) => ({ activeMs, correct, incorrect });

function readHistory(storage) {
  try {
    const data = JSON.parse(storage?.getItem(HISTORY_KEY));
    if (data?.version !== 1 || !validStats(data.totals) || !data.stories || typeof data.stories !== 'object') return null;
    const stories = {};
    for (const [id, entry] of Object.entries(data.stories)) {
      if (!validStory(Number(id)) || !validStats(entry)) continue;
      stories[id] = {
        ...copyStats(entry),
        completions: Number.isSafeInteger(entry.completions) && entry.completions > 0 ? entry.completions : 0,
        lastCompletedAt: typeof entry.lastCompletedAt === 'string' && Number.isFinite(Date.parse(entry.lastCompletedAt)) ? entry.lastCompletedAt : null,
      };
    }
    return { version: 1, totals: copyStats(data.totals), stories };
  } catch { return null; }
}

function addStats(previous, delta) {
  return {
    activeMs: previous.activeMs + (delta.activeMs || 0),
    correct: previous.correct + (delta.correct || 0),
    incorrect: previous.incorrect + (delta.incorrect || 0),
  };
}

// A fresh store represents a new page load: only history is restored from disk.
export function createReadingProgress({ storage, legacyStorage } = {}) {
  let history = readHistory(storage);
  let session = emptyStats();
  let persistenceAvailable = Boolean(storage);
  function save() {
    try {
      if (!storage) throw new Error('Storage unavailable');
      storage.setItem(HISTORY_KEY, JSON.stringify(history));
      persistenceAvailable = true;
    } catch { persistenceAvailable = false; }
  }
  if (!history) {
    history = emptyHistory();
    // Preserve the old summary once, without restoring its television reward.
    try {
      const legacy = JSON.parse(legacyStorage?.getItem(LEGACY_SESSION_KEY));
      if (validStats(legacy)) {
        history = { ...history, totals: copyStats(legacy) };
        save();
        if (persistenceAvailable) legacyStorage.removeItem(LEGACY_SESSION_KEY);
      }
    } catch { /* An older or unavailable session must not prevent reading. */ }
  }

  function update(storyId, delta, completedAt = null) {
    if (!validStory(storyId)) return;
    // Incorporate changes already saved by another tab before adding this event.
    history = (persistenceAvailable ? readHistory(storage) : null) || history;
    const previous = history.stories[storyId] || { ...emptyStats(), completions: 0, lastCompletedAt: null };
    history = {
      version: 1,
      totals: addStats(history.totals, delta),
      stories: {
        ...history.stories,
        [storyId]: {
          ...addStats(previous, delta),
          completions: previous.completions + (completedAt ? 1 : 0),
          lastCompletedAt: completedAt || previous.lastCompletedAt,
        },
      },
    };
    session = addStats(session, delta);
    save();
  }

  return {
    snapshot: () => ({ stats: session, history, persistenceAvailable }),
    recordAnswer(storyId, correct) { update(storyId, correct ? { correct: 1 } : { incorrect: 1 }); },
    recordTime(storyId, activeMs) {
      if (Number.isFinite(activeMs) && activeMs > 0) update(storyId, { activeMs });
    },
    completeStory(storyId) { update(storyId, {}, new Date().toISOString()); },
    syncHistory() { history = (persistenceAvailable ? readHistory(storage) : null) || history; },
  };
}

export function accuracyPercent({ correct, incorrect }) {
  const attempts = correct + incorrect;
  return attempts ? Math.round(correct / attempts * 1000) / 10 : 0;
}

export function formatReadingTime(activeMs) {
  const seconds = Math.floor(Math.max(0, activeMs) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60) % 60;
  return `${hours ? `${hours} h ` : ''}${minutes} min ${String(seconds % 60).padStart(2, '0')} s`;
}
