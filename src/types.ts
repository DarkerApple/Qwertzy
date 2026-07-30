/** A single message inside an item's thread — an elaboration on the original thought. */
export interface Reply {
  id: string;
  text: string;
  createdAt: number;
}

export type TimerState = 'running' | 'paused' | 'done';

/**
 * A countdown written into a note as `time(10m)`. One per token, in the order
 * the tokens appear, so the text stays the source of truth for how many there
 * are and how long each runs.
 */
export interface NoteTimer {
  id: string;
  /** Duration the token asked for, in seconds. */
  seconds: number;
  label: string | null;
  /** Absolute end time while running — survives a reload or a closed tab. */
  endsAt: number | null;
  /** What was left when paused, in ms. */
  remainingMs: number;
  state: TimerState;
}

/**
 * The one unit Qwertzy stores. Every captured thought is an item, and every item
 * is a checkbox — that is what makes the note "automatically" a checklist. The
 * thread (`replies`) is where an idea gets elaborated without leaving the list.
 */
export interface Item {
  id: string;
  text: string;
  createdAt: number;
  done: boolean;
  /** When it was checked off, so completed work can still show a time. */
  doneAt: number | null;
  replies: Reply[];
  /** Set when this item was split out of another item's thread. */
  parentId: string | null;
  /** One per `time(...)` token in the text, in token order. */
  timers: NoteTimer[];
}

export type Filter = 'all' | 'open' | 'done';

export interface AppState {
  version: 1;
  items: Item[];
}
