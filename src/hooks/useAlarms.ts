import { useCallback, useEffect, useRef, useState } from 'react';
import type { Alarm, Repeat } from '../lib/alarms';
import { isDue, loadAlarms, saveAlarms } from '../lib/alarms';
import { newId } from '../lib/id';
import { notifyTimerDone } from '../lib/notify';

export interface Ring {
  id: string;
  label: string;
  at: number;
}

/**
 * The alarm list, plus the once-a-second check that rings the due ones. Lives
 * at the top of the app so an alarm goes off wherever you happen to be.
 */
export function useAlarms() {
  const [alarms, setAlarms] = useState<Alarm[]>(loadAlarms);
  const [ringing, setRinging] = useState<Ring[]>([]);
  const announced = useRef(new Set<string>());

  useEffect(() => {
    saveAlarms(alarms);
  }, [alarms]);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const due = alarms.filter((alarm) => isDue(alarm, now));
      if (due.length === 0) return;

      setAlarms((prev) =>
        prev.map((alarm) => (due.some((d) => d.id === alarm.id) ? { ...alarm, lastFiredAt: now } : alarm)),
      );

      for (const alarm of due) {
        // One ring per occurrence, even if the tick overlaps a re-render.
        const key = `${alarm.id}:${new Date(now).toDateString()}:${alarm.time}`;
        if (announced.current.has(key)) continue;
        announced.current.add(key);
        const label = alarm.label.trim() || `Alarm at ${alarm.time}`;
        notifyTimerDone(`⏰ ${label}`, `It's ${alarm.time}.`);
        setRinging((prev) => [...prev, { id: `${alarm.id}-${now}`, label, at: now }]);
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [alarms]);

  const add = useCallback((time: string, label: string, repeat: Repeat, weekday: number) => {
    setAlarms((prev) => [
      ...prev,
      {
        id: newId(),
        label,
        time,
        repeat,
        weekday,
        enabled: true,
        // Anything already past today counts as handled, so adding an alarm
        // for a time that's just gone doesn't set it off immediately.
        lastFiredAt: Date.now(),
        createdAt: Date.now(),
      },
    ]);
  }, []);

  const remove = useCallback((id: string) => {
    setAlarms((prev) => prev.filter((alarm) => alarm.id !== id));
  }, []);

  const setEnabled = useCallback((id: string, enabled: boolean) => {
    setAlarms((prev) => prev.map((alarm) => (alarm.id === id ? { ...alarm, enabled } : alarm)));
  }, []);

  const dismiss = useCallback((ringId: string) => {
    setRinging((prev) => prev.filter((ring) => ring.id !== ringId));
  }, []);

  return { alarms, ringing, add, remove, setEnabled, dismiss };
}
