/**
 * Timers you write into a note.
 *
 *   time(60)          a minute
 *   time(90s)         ninety seconds
 *   time(10m)         ten minutes
 *   time(1h30m)       an hour and a half
 *   time(2:30)        mm:ss
 *   time(10m, steep)  same, with a label the notification will use
 *
 * `timer(...)` works identically. A token whose duration can't be read is left
 * alone as ordinary text rather than silently swallowed.
 */
export interface TimerToken {
  /** The matched source, e.g. "time(10m)". */
  raw: string;
  start: number;
  end: number;
  seconds: number;
  label: string | null;
}

const TOKEN = /\btimer?\(([^)\n]*)\)/gi;
const UNITS = /^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?$/i;

/** Seconds for a duration string, or null when it isn't one. */
export function parseDuration(input: string): number | null {
  const text = input.trim().toLowerCase();
  if (!text) return null;

  // Bare number: seconds.
  if (/^\d+$/.test(text)) {
    const seconds = Number(text);
    return seconds > 0 ? seconds : null;
  }

  // Clock form: mm:ss or h:mm:ss.
  if (/^\d+(?::\d{1,2}){1,2}$/.test(text)) {
    const parts = text.split(':').map(Number);
    if (parts.some((p) => Number.isNaN(p))) return null;
    const seconds = parts.reduce((total, part) => total * 60 + part, 0);
    return seconds > 0 ? seconds : null;
  }

  // Unit form: 1h30m, 10m, 90s.
  const match = UNITS.exec(text);
  if (!match || !match.slice(1).some(Boolean)) return null;
  const [, h, m, s] = match;
  const seconds = Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0);
  return seconds > 0 ? seconds : null;
}

/** Every readable timer token in a note, in the order they appear. */
export function findTimerTokens(text: string): TimerToken[] {
  const tokens: TimerToken[] = [];
  TOKEN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TOKEN.exec(text))) {
    const [rawDuration, ...rest] = match[1].split(',');
    const seconds = parseDuration(rawDuration);
    if (seconds === null) continue;
    const label = rest.join(',').trim();
    tokens.push({
      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,
      seconds,
      label: label || null,
    });
  }
  return tokens;
}

/**
 * `graph(x^2)` or `graph(sin(x), -6, 6)` — the plotting twin of time(). Kept
 * here so both tokens are scanned the same way.
 */
export interface GraphToken {
  raw: string;
  start: number;
  end: number;
  expression: string;
  from: number;
  to: number;
}

const GRAPH = /\bgraph\(([^)\n]*(?:\([^)\n]*\)[^)\n]*)*)\)/gi;

export function findGraphTokens(text: string): GraphToken[] {
  const tokens: GraphToken[] = [];
  GRAPH.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = GRAPH.exec(text))) {
    // Split on the last two commas only, so "graph(max(x,0), -5, 5)" works.
    const inner = match[1].trim();
    if (!inner) continue;
    const parts = splitRange(inner);
    tokens.push({
      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,
      expression: parts.expression,
      from: parts.from,
      to: parts.to,
    });
  }
  return tokens;
}

function splitRange(inner: string): { expression: string; from: number; to: number } {
  const pieces = splitTopLevel(inner);
  if (pieces.length >= 3) {
    const from = Number(pieces[pieces.length - 2]);
    const to = Number(pieces[pieces.length - 1]);
    if (Number.isFinite(from) && Number.isFinite(to) && from < to) {
      return { expression: pieces.slice(0, -2).join(','), from, to };
    }
  }
  return { expression: inner, from: -10, to: 10 };
}

/** Split on commas that aren't inside brackets. */
function splitTopLevel(input: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of input) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === ',' && depth === 0) {
      out.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  out.push(current.trim());
  return out;
}

export function hasTimer(text: string): boolean {
  return findTimerTokens(text).length > 0;
}

/**
 * The note as prose, with the timer tokens taken out — what a notification or
 * a toast should say, since neither can render a clock.
 */
export function withoutTimerTokens(text: string): string {
  const tokens = [...findTimerTokens(text), ...findGraphTokens(text)].sort(
    (a, b) => a.start - b.start,
  );
  if (tokens.length === 0) return text;
  let out = '';
  let cursor = 0;
  for (const token of tokens) {
    out += text.slice(cursor, token.start);
    cursor = token.end;
  }
  out += text.slice(cursor);
  return out.replace(/\s{2,}/g, ' ').trim();
}

/** "9:59" / "1:04:03" — never negative, always at least "0:00". */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/** "10 minutes" / "90 seconds" — for hints and notification bodies. */
export function describeDuration(seconds: number): string {
  if (seconds % 3600 === 0 && seconds >= 3600) {
    const hours = seconds / 3600;
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
  if (seconds % 60 === 0) {
    const minutes = seconds / 60;
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  return `${seconds} second${seconds === 1 ? '' : 's'}`;
}

/** Milliseconds left on a timer as of `now`. */
export function remainingMs(
  timer: { state: string; endsAt: number | null; remainingMs: number },
  now: number,
): number {
  if (timer.state === 'running' && timer.endsAt !== null) return Math.max(0, timer.endsAt - now);
  if (timer.state === 'done') return 0;
  return Math.max(0, timer.remainingMs);
}
