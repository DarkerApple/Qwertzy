import type { AppState, Item, NoteTimer, TimerState } from '../types';
import { newId } from './id';

const KEY = 'qwertzy.v1';
export const THEME_KEY = 'qwertzy.theme';

// Notes written before the rename. Pages serves every project site from one
// origin, so an older build's notes are still right there in localStorage —
// they're read once and then written back under the new key. The old entry is
// left alone rather than deleted, so an older build still opens its own data.
const LEGACY_KEY = 'listify.v1';

/**
 * A notebook's backing store. The everyday notes use localStorage directly;
 * the secret notebook swaps in an encrypted implementation with the same shape,
 * which is why every screen below works for both without knowing the difference.
 */
export interface NotebookStorage {
  load: () => Item[];
  save: (items: Item[]) => void;
}

const TIMER_STATES: TimerState[] = ['running', 'paused', 'done'];

function reviveTimer(raw: unknown): NoteTimer | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.seconds !== 'number' || o.seconds <= 0) return null;
  const state = TIMER_STATES.includes(o.state as TimerState) ? (o.state as TimerState) : 'paused';
  return {
    id: o.id,
    seconds: o.seconds,
    label: typeof o.label === 'string' ? o.label : null,
    endsAt: typeof o.endsAt === 'number' ? o.endsAt : null,
    remainingMs: typeof o.remainingMs === 'number' ? o.remainingMs : o.seconds * 1000,
    state,
  };
}

/** Anything read from disk is untrusted — coerce it into a valid Item or drop it. */
function reviveItem(raw: unknown): Item | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.text !== 'string') return null;
  const createdAt = typeof o.createdAt === 'number' ? o.createdAt : Date.now();
  const timers = Array.isArray(o.timers)
    ? o.timers.flatMap((t) => {
        const timer = reviveTimer(t);
        return timer ? [timer] : [];
      })
    : [];
  return {
    id: o.id,
    text: o.text,
    createdAt,
    done: o.done === true,
    doneAt: typeof o.doneAt === 'number' ? o.doneAt : null,
    parentId: typeof o.parentId === 'string' ? o.parentId : null,
    timers,
  };
}

/**
 * Notes written before elaborations were notes kept their thread in a
 * `replies` array. Each of those becomes a child note, so nothing written is
 * lost and old data opens as though it had always worked this way.
 */
function reviveAll(list: unknown[]): Item[] {
  const items: Item[] = [];
  for (const raw of list) {
    const item = reviveItem(raw);
    if (!item) continue;
    items.push(item);

    const legacy = (raw as Record<string, unknown>)?.replies;
    if (!Array.isArray(legacy)) continue;
    legacy.forEach((reply, i) => {
      if (!reply || typeof reply !== 'object') return;
      const r = reply as Record<string, unknown>;
      if (typeof r.text !== 'string' || !r.text.trim()) return;
      items.push({
        id: typeof r.id === 'string' ? r.id : newId(),
        text: r.text,
        createdAt: typeof r.createdAt === 'number' ? r.createdAt : item.createdAt + i + 1,
        done: false,
        doneAt: null,
        parentId: item.id,
        timers: [],
      });
    });
  }
  return items;
}

export function loadItems(): Item[] {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (!parsed || !Array.isArray(parsed.items)) return [];
    return reviveAll(parsed.items);
  } catch {
    // Corrupt or unavailable storage shouldn't blank the app — start empty.
    return [];
  }
}

export function saveItems(items: Item[]): void {
  try {
    const state: AppState = { version: 1, items };
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Quota or private mode: keep running in memory rather than crashing.
  }
}

export const mainStorage: NotebookStorage = { load: loadItems, save: saveItems };

/** Serialized backup the user can download. */
export function exportJSON(items: Item[]): string {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), items }, null, 2);
}

/** Parse a backup file; returns null when the file isn't a Qwertzy export. */
export function parseImport(text: string): Item[] | null {
  try {
    const parsed = JSON.parse(text) as Partial<AppState>;
    if (!parsed || !Array.isArray(parsed.items)) return null;
    return reviveAll(parsed.items);
  } catch {
    return null;
  }
}
