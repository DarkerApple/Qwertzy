import { useEffect, useMemo, useRef, useState } from 'react';
import type { Item } from '../types';
import { monthSummaries } from '../lib/group';
import { currentMonthKey, monthLabel } from '../lib/time';
import { SearchIcon } from './icons';

export interface Destination {
  id: string;
  label: string;
  hint: string;
  go: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  items: Item[];
  onGoMonth: (key: string) => void;
  pages: Destination[];
}

/**
 * One way to get anywhere: ⌘K / Ctrl+K, type, Enter. Pages and months in the
 * same list, because "go to June" and "go to Settings" are the same intent.
 */
export function CommandPalette({ open, onClose, items, onGoMonth, pages }: Props) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const destinations = useMemo(() => {
    const months = monthSummaries(items)
      .slice()
      .reverse()
      .map((summary) => ({
        id: `m-${summary.key}`,
        label: monthLabel(summary.key),
        hint: `${summary.total} ${summary.total === 1 ? 'note' : 'notes'} · ${summary.open} to do`,
        go: () => onGoMonth(summary.key),
      }));
    const thisMonth = currentMonthKey();
    if (!months.some((m) => m.id === `m-${thisMonth}`)) {
      months.unshift({
        id: `m-${thisMonth}`,
        label: monthLabel(thisMonth),
        hint: 'This month — a blank page',
        go: () => onGoMonth(thisMonth),
      });
    }
    return [...pages, ...months];
  }, [items, onGoMonth, pages]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return destinations.slice(0, 9);
    return destinations
      .filter((d) => `${d.label} ${d.hint}`.toLowerCase().includes(q))
      .slice(0, 9);
  }, [destinations, query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    // Focus after the dialog has painted, or the keystroke that opened it lands
    // in whatever had focus before.
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => setActive(0), [query]);

  if (!open) return null;

  function choose(index: number) {
    const target = results[index];
    if (!target) return;
    onClose();
    target.go();
  }

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      style={{ backgroundColor: 'rgb(0 0 0 / 0.35)' }}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Go to"
        onClick={(e) => e.stopPropagation()}
        className="animate-page-in surface hairline w-full max-w-lg overflow-hidden rounded-2xl border shadow-lift"
      >
        <div className="hairline flex items-center gap-2 border-b px-4 py-3">
          <SearchIcon className="muted h-4 w-4 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                choose(active);
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
            placeholder="Go to a page or a month…"
            aria-label="Go to a page or a month"
            className="w-full bg-transparent text-[15px] placeholder:text-ink-400 focus:outline-none dark:placeholder:text-ink-500"
          />
          <kbd className="hairline muted hidden rounded border px-1.5 py-0.5 text-[10px] sm:block">
            Esc
          </kbd>
        </div>

        <ul className="max-h-[50vh] overflow-y-auto p-1.5">
          {results.length === 0 && (
            <li className="muted px-3 py-6 text-center text-[13px]">Nothing matches that.</li>
          )}
          {results.map((destination, index) => (
            <li key={destination.id}>
              <button
                type="button"
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(index)}
                className={`flex w-full items-baseline gap-3 rounded-xl px-3 py-2 text-left transition ${
                  index === active ? 'rowtint' : ''
                }`}
              >
                <span className="text-[14px]">{destination.label}</span>
                <span className="muted ml-auto truncate text-[11px]">{destination.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
