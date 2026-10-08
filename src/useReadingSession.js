import { useCallback, useEffect, useState } from 'react';
import { createReadingProgress, HISTORY_KEY } from './progress.mjs';

function browserStorage(name) {
  try { return window[name]; } catch { return undefined; }
}

export function useReadingSession(active, storyId) {
  const [store] = useState(() => createReadingProgress({
    storage: browserStorage('localStorage'),
    legacyStorage: browserStorage('sessionStorage'),
  }));
  const [snapshot, setSnapshot] = useState(() => store.snapshot());
  const refresh = useCallback(() => setSnapshot(store.snapshot()), [store]);

  useEffect(() => {
    function sync(event) {
      if (event.key === HISTORY_KEY) { store.syncHistory(); refresh(); }
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [store, refresh]);

  useEffect(() => {
    if (!active || !storyId) return;
    let last = document.visibilityState === 'visible' ? performance.now() : null;
    function tick() {
      const now = performance.now();
      if (last !== null) { store.recordTime(storyId, Math.max(0, now - last)); refresh(); }
      last = document.visibilityState === 'visible' ? now : null;
    }
    function suspend() { tick(); last = null; }
    const timer = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('pagehide', suspend);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('pagehide', suspend);
      if (last !== null) { store.recordTime(storyId, Math.max(0, performance.now() - last)); refresh(); }
    };
  }, [active, storyId, store, refresh]);

  const recordAnswer = useCallback(correct => {
    store.recordAnswer(storyId, correct);
    refresh();
  }, [storyId, store, refresh]);
  const completeStory = useCallback(id => { store.completeStory(id); refresh(); }, [store, refresh]);
  return { ...snapshot, recordAnswer, completeStory };
}
