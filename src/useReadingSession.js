import { useCallback, useEffect, useRef, useState } from 'react';

const storageKey = 'bluey-reading-session-v1';
const emptySession = { activeMs: 0, correct: 0, incorrect: 0 };
function loadSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    if (saved && Number.isFinite(saved.activeMs) && saved.activeMs >= 0 &&
        Number.isSafeInteger(saved.correct) && saved.correct >= 0 &&
        Number.isSafeInteger(saved.incorrect) && saved.incorrect >= 0) return saved;
  } catch { /* Reading still works when browser storage is unavailable. */ }
  return { ...emptySession };
}

export function useReadingSession(active) {
  const [stats, setStats] = useState(loadSession);
  const current = useRef(stats);
  const add = useCallback(delta => {
    const next = {
      activeMs: current.current.activeMs + (delta.activeMs || 0),
      correct: current.current.correct + (delta.correct || 0),
      incorrect: current.current.incorrect + (delta.incorrect || 0),
    };
    current.current = next;
    try { sessionStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Keep in-memory totals. */ }
    setStats(next);
  }, []);

  useEffect(() => {
    if (!active) return;
    let last = document.visibilityState === 'visible' ? performance.now() : null;
    function tick() {
      const now = performance.now();
      if (last !== null) add({ activeMs: Math.max(0, now - last) });
      last = document.visibilityState === 'visible' ? now : null;
    }
    function suspend() {
      tick();
      last = null;
    }
    const timer = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('pagehide', suspend);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('pagehide', suspend);
      if (last !== null) add({ activeMs: Math.max(0, performance.now() - last) });
    };
  }, [active, add]);

  const recordAnswer = useCallback(correct => add(correct ? { correct: 1 } : { incorrect: 1 }), [add]);
  return { stats, recordAnswer };
}
