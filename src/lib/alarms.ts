/**
 * Alarms: ring at a time of day, optionally on repeat.
 *
 * Same honest limit as the note timers — there's no background worker, so an
 * alarm rings when the app is open. One that came due while the tab was closed
 * is marked missed rather than announced hours late, and a repeating one moves
 * on to its next occurrence instead of firing a backlog.
 */
export type Repeat = 'once' | 'daily' | 'weekdays' | 'weekly';

export interface Alarm {
  id: string;
  label: string;
  /** Local wall-clock time, "HH:MM". */
  time: string;
  repeat: Repeat;
  /** For 'weekly': 0 = Sunday. For the rest, ignored. */
  weekday: number;
  enabled: boolean;
  /** When it last rang, so it rings once per occurrence. */
  lastFiredAt: number | null;
  createdAt: number;
}

const KEY = 'qwertzy.alarms.v1';

export function loadAlarms(): Alarm[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((a) => {
      if (!a || typeof a !== 'object') return [];
      const o = a as Record<string, unknown>;
      if (typeof o.id !== 'string' || typeof o.time !== 'string') return [];
      if (!/^\d{2}:\d{2}$/.test(o.time)) return [];
      const repeat: Repeat = ['once', 'daily', 'weekdays', 'weekly'].includes(o.repeat as string)
        ? (o.repeat as Repeat)
        : 'once';
      return [
        {
          id: o.id,
          label: typeof o.label === 'string' ? o.label : '',
          time: o.time,
          repeat,
          weekday: typeof o.weekday === 'number' ? o.weekday : new Date().getDay(),
          enabled: o.enabled !== false,
          lastFiredAt: typeof o.lastFiredAt === 'number' ? o.lastFiredAt : null,
          createdAt: typeof o.createdAt === 'number' ? o.createdAt : Date.now(),
        },
      ];
    });
  } catch {
    return [];
  }
}

export function saveAlarms(alarms: Alarm[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(alarms));
  } catch {
    /* quota or private mode */
  }
}

function atTimeOn(day: Date, time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  const d = new Date(day);
  d.setHours(hours, minutes, 0, 0);
  return d.getTime();
}

function matchesDay(alarm: Alarm, day: Date): boolean {
  const weekday = day.getDay();
  switch (alarm.repeat) {
    case 'daily':
      return true;
    case 'weekdays':
      return weekday >= 1 && weekday <= 5;
    case 'weekly':
      return weekday === alarm.weekday;
    case 'once':
      return true;
  }
}

/**
 * The next moment this alarm should ring, at or after `now`. Null when a
 * one-off has already been and gone.
 */
export function nextRing(alarm: Alarm, now = Date.now()): number | null {
  const today = new Date(now);
  for (let offset = 0; offset < 14; offset += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() + offset);
    if (!matchesDay(alarm, day)) continue;
    const when = atTimeOn(day, alarm.time);
    if (when <= now) continue;
    // A one-off that already rang today is finished.
    if (alarm.repeat === 'once' && alarm.lastFiredAt && alarm.lastFiredAt >= atTimeOn(today, alarm.time)) {
      return null;
    }
    return when;
  }
  return null;
}

/**
 * Is this alarm due right now? True only inside a short window after its time,
 * so opening the app in the evening doesn't set off the morning's alarm.
 */
const DUE_WINDOW_MS = 90_000;

export function isDue(alarm: Alarm, now = Date.now()): boolean {
  if (!alarm.enabled) return false;
  const today = new Date(now);
  if (!matchesDay(alarm, today)) return false;
  const dueAt = atTimeOn(today, alarm.time);
  if (now < dueAt || now - dueAt > DUE_WINDOW_MS) return false;
  // Once per occurrence.
  return !alarm.lastFiredAt || alarm.lastFiredAt < dueAt;
}

export function describeRepeat(alarm: Alarm): string {
  switch (alarm.repeat) {
    case 'daily':
      return 'Every day';
    case 'weekdays':
      return 'Weekdays';
    case 'weekly':
      return `Every ${new Date(2024, 0, 7 + alarm.weekday).toLocaleDateString(undefined, { weekday: 'long' })}`;
    case 'once':
      return 'Once';
  }
}

/** "in 3h 20m" / "tomorrow at 07:00" — how long until it goes off. */
export function describeNext(alarm: Alarm, now = Date.now()): string {
  if (!alarm.enabled) return 'Off';
  const next = nextRing(alarm, now);
  if (next === null) return 'Done';
  const ms = next - now;
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `in ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `in ${hours}h ${minutes % 60}m`;
  const days = Math.round(hours / 24);
  return `in ${days} day${days === 1 ? '' : 's'}`;
}
