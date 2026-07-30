import type { Filter, Item } from '../types';
import { dayKey, monthKey } from './time';

export interface MonthSummary {
  key: string;
  total: number;
  done: number;
  open: number;
  /** How many of them are elaborations on another note. */
  threads: number;
}

function matches(item: Item, query: string): boolean {
  if (!query) return true;
  return item.text.toLowerCase().includes(query.toLowerCase());
}

/** Only notes that start a thought; elaborations live on their own page. */
export function roots(items: Item[]): Item[] {
  const ids = new Set(items.map((i) => i.id));
  return items.filter((item) => !item.parentId || !ids.has(item.parentId));
}

/** How many notes hang off this one, all the way down. */
export function countBelow(items: Item[], id: string): number {
  const direct = items.filter((item) => item.parentId === id);
  return direct.reduce((total, child) => total + 1 + countBelow(items, child.id), 0);
}

export function filterItems(items: Item[], filter: Filter, query: string): Item[] {
  return items.filter((item) => {
    const passes = filter === 'all' || (filter === 'open' ? !item.done : item.done);
    return passes && matches(item, query);
  });
}

/** One entry per month that holds anything, oldest first — drives the tab bar. */
export function monthSummaries(items: Item[]): MonthSummary[] {
  const map = new Map<string, MonthSummary>();
  for (const item of items) {
    const key = monthKey(item.createdAt);
    const summary = map.get(key) ?? { key, total: 0, done: 0, open: 0, threads: 0 };
    summary.total += 1;
    if (item.done) summary.done += 1;
    else summary.open += 1;
    if (item.parentId) summary.threads += 1;
    map.set(key, summary);
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * A month reads top to bottom like a page you keep adding to, so items run
 * oldest first and the newest thought sits closest to where you write.
 */
export function inWrittenOrder(items: Item[]): Item[] {
  return [...items].sort((a, b) => a.createdAt - b.createdAt);
}

/** True when this line was written on a different day than the one before it. */
export function startsNewDay(items: Item[], index: number): boolean {
  if (index === 0) return false;
  return dayKey(items[index].createdAt) !== dayKey(items[index - 1].createdAt);
}

export function inMonth(items: Item[], month: string): Item[] {
  return items.filter((item) => monthKey(item.createdAt) === month);
}

/** Search results stay grouped by month so hits keep their context. */
export function byMonth(items: Item[]): { key: string; items: Item[] }[] {
  const map = new Map<string, Item[]>();
  for (const item of items) {
    const key = monthKey(item.createdAt);
    map.set(key, [...(map.get(key) ?? []), item]);
  }
  return [...map.entries()]
    .map(([key, list]) => ({ key, items: list }))
    .sort((a, b) => b.key.localeCompare(a.key));
}
