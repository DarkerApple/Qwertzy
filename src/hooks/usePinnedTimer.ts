import { useCallback, useEffect, useState } from 'react';
import { notifyTimerDone } from '../lib/notify';

export interface PinnedTimer {
  /** Total length in seconds. */
  seconds: number;
  label: string;
  endsAt: number | null;
  remainingMs: number;
  state: 'running' | 'paused' | 'done';
}

const KEY = 'qwertzy.pinned.v1';

export const PRESETS = [
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '25 min', seconds: 1500 },
  { label: '45 min', seconds: 2700 },
];

function load(): PinnedTimer | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Partial<PinnedTimer>;
    if (typeof o?.seconds !== 'number' || o.seconds <= 0) return null;
    return {
      seconds: o.seconds,
      label: typeof o.label === 'string' ? o.label : '',
      endsAt: typeof o.endsAt === 'number' ? o.endsAt : null,
      remainingMs: typeof o.remainingMs === 'number' ? o.remainingMs : o.seconds * 1000,
      state: o.state === 'running' || o.state === 'done' ? o.state : 'paused',
    };
  } catch {
    return null;
  }
}

/**
 * One timer pinned to the header, alive on every page and across reloads —
 * for the thing you're timing rather than a thing you wrote down. Always
 * resettable, which is the point of pinning it.
 */
export function usePinnedTimer() {
  const [timer, setTimer] = useState<PinnedTimer | null>(load);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    try {
      if (timer) localStorage.setItem(KEY, JSON.stringify(timer));
      else localStorage.removeItem(KEY);
    } catch {
      /* private mode */
    }
  }, [timer]);

  useEffect(() => {
    if (timer?.state !== 'running') return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [timer?.state]);

  // Reaching zero rings once and stops; the same rule as the note timers.
  useEffect(() => {
    if (!timer || timer.state !== 'running' || timer.endsAt === null) return;
    if (timer.endsAt > now) return;
    setTimer({ ...timer, state: 'done', remainingMs: 0, endsAt: null });
    if (now - timer.endsAt < 60_000) {
      notifyTimerDone('⏱ Pinned timer', timer.label.trim() || 'Time’s up.');
    }
  }, [timer, now]);

  const start = useCallback((seconds: number, label = '') => {
    setNow(Date.now());
    setTimer({
      seconds,
      label,
      endsAt: Date.now() + seconds * 1000,
      remainingMs: seconds * 1000,
      state: 'running',
    });
  }, []);

  const toggle = useCallback(() => {
    setNow(Date.now());
    setTimer((prev) => {
      if (!prev) return prev;
      const at = Date.now();
      if (prev.state === 'running' && prev.endsAt !== null) {
        return { ...prev, state: 'paused', remainingMs: Math.max(0, prev.endsAt - at), endsAt: null };
      }
      const left = prev.state === 'done' ? prev.seconds * 1000 : Math.max(1000, prev.remainingMs);
      return { ...prev, state: 'running', remainingMs: left, endsAt: at + left };
    });
  }, []);

  const reset = useCallback(() => {
    setNow(Date.now());
    setTimer((prev) =>
      prev
        ? { ...prev, state: 'paused', remainingMs: prev.seconds * 1000, endsAt: null }
        : prev,
    );
  }, []);

  const clear = useCallback(() => setTimer(null), []);

  const remaining = timer
    ? timer.state === 'running' && timer.endsAt !== null
      ? Math.max(0, timer.endsAt - now)
      : Math.max(0, timer.remainingMs)
    : 0;

  return { timer, remaining, start, toggle, reset, clear };
}
