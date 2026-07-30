import { useMemo } from 'react';
import type { Item } from '../types';
import { monthSummaries } from '../lib/group';
import type { MonthSummary } from '../lib/group';
import { currentMonthKey, monthLabel } from '../lib/time';
import { BookIcon, ChevronRightIcon, LockIcon, SparkIcon, UnlockIcon } from './icons';
import { QuartzBadge } from './QuartzMark';

interface Props {
  items: Item[];
  vaultExists: boolean;
  vaultOpen: boolean;
  onOpenMonth: (key: string) => void;
  onOpenGuide: () => void;
  onOpenSecret: () => void;
  themeToggle: React.ReactNode;
}

const MONTH_NAMES = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleDateString(undefined, { month: 'short' }),
);

/**
 * The way in: every year you've written in, as a grid of months. It's a
 * contents page — small, dense, and honest about which months hold anything.
 */
export function Home({
  items,
  vaultExists,
  vaultOpen,
  onOpenMonth,
  onOpenGuide,
  onOpenSecret,
  themeToggle,
}: Props) {
  const thisMonth = currentMonthKey();
  const summaries = useMemo(() => monthSummaries(items), [items]);
  const byKey = useMemo(() => new Map(summaries.map((s) => [s.key, s])), [summaries]);

  const years = useMemo(() => {
    const set = new Set(summaries.map((s) => Number(s.key.slice(0, 4))));
    set.add(new Date().getFullYear());
    return [...set].sort((a, b) => b - a);
  }, [summaries]);

  const open = items.filter((i) => !i.done).length;
  const thisMonthSummary = byKey.get(thisMonth);

  return (
    <div className="min-h-dvh">
      <header
        className="sticky top-0 z-30"
        style={{ height: 'var(--header-h)', backgroundColor: 'rgb(var(--paper))' }}
      >
        <div className="mx-auto flex h-full max-w-2xl items-center gap-2 px-3 sm:px-4">
          <QuartzBadge />
          <span className="text-[15px] font-semibold tracking-tight">Qwertzy</span>
          <div className="ml-auto">{themeToggle}</div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-3 pb-20 pt-2 sm:px-4">
        <h1 className="font-display text-[32px] leading-tight tracking-tight sm:text-[38px]">
          Your notebooks
        </h1>
        <p className="muted mt-1 text-[13px]">
          {items.length === 0
            ? 'Nothing written yet — start on this month’s page.'
            : `${items.length} ${items.length === 1 ? 'note' : 'notes'} · ${open} still to do`}
        </p>

        {/* The one you almost always want. */}
        <button
          type="button"
          onClick={() => onOpenMonth(thisMonth)}
          className="surface hairline group mt-5 flex w-full items-center gap-4 rounded-2xl border p-4 text-left shadow-sheet transition hover:border-accent-300 dark:hover:border-accent-700"
        >
          <div className="min-w-0 flex-1">
            <p className="muted text-[11px] font-medium uppercase tracking-[0.14em]">
              This month
            </p>
            <p className="font-display mt-0.5 text-[24px] leading-none">{monthLabel(thisMonth)}</p>
            <p className="muted mt-1.5 text-[12px]">
              {thisMonthSummary
                ? `${thisMonthSummary.total} ${thisMonthSummary.total === 1 ? 'note' : 'notes'} · ${thisMonthSummary.open} to do`
                : 'A blank page — write something'}
            </p>
          </div>
          <ChevronRightIcon className="muted h-5 w-5 transition group-hover:translate-x-0.5" />
        </button>

        {years.map((year) => (
          <section key={year} className="mt-8">
            <h2 className="font-display mb-2 text-[20px] tracking-tight">{year}</h2>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {MONTH_NAMES.map((name, i) => {
                const key = `${year}-${String(i + 1).padStart(2, '0')}`;
                return (
                  <MonthCard
                    key={key}
                    name={name}
                    summary={byKey.get(key)}
                    isCurrent={key === thisMonth}
                    isFuture={key > thisMonth}
                    onOpen={() => onOpenMonth(key)}
                  />
                );
              })}
            </div>
          </section>
        ))}

        <div className="mt-8 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onOpenGuide}
            className="surface hairline group flex items-center gap-3 rounded-2xl border p-4 text-left transition hover:border-accent-300 dark:hover:border-accent-700"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-500/10 text-accent-700 dark:text-accent-300">
              <BookIcon className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-medium">How Qwertzy works</span>
              <span className="muted block truncate text-[12px]">
                Writing, timers, threads, months
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenSecret}
            className="surface hairline group flex items-center gap-3 rounded-2xl border p-4 text-left transition hover:border-amber-300 dark:hover:border-amber-700/60"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
              {vaultOpen ? (
                <UnlockIcon className="h-[18px] w-[18px]" />
              ) : (
                <LockIcon className="h-[18px] w-[18px]" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-medium">Secret notes</span>
              <span className="muted block truncate text-[12px]">
                {vaultOpen ? 'Unlocked — open it' : vaultExists ? 'Locked' : 'Set a password'}
              </span>
            </span>
          </button>
        </div>

        <p className="muted mt-8 flex items-center justify-center gap-1.5 text-center text-[11px]">
          <SparkIcon className="h-3.5 w-3.5" />
          Everything is stored in this browser only
        </p>
      </main>
    </div>
  );
}

function MonthCard({
  name,
  summary,
  isCurrent,
  isFuture,
  onOpen,
}: {
  name: string;
  summary?: MonthSummary;
  isCurrent: boolean;
  isFuture: boolean;
  onOpen: () => void;
}) {
  const total = summary?.total ?? 0;
  const pct = total ? Math.round(((summary?.done ?? 0) / total) * 100) : 0;

  // A month with nothing written in it isn't a page worth opening — only the
  // current one is, because that's where writing goes.
  if (total === 0 && !isCurrent) {
    return (
      <div
        className={`hairline muted rounded-xl border border-dashed px-3 py-2.5 ${
          isFuture ? 'opacity-35' : 'opacity-55'
        }`}
      >
        <span className="text-[13px] font-medium">{name}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${name} — ${total} ${total === 1 ? 'note' : 'notes'}`}
      className={`surface rounded-xl border px-3 py-2.5 text-left transition hover:-translate-y-px hover:shadow-sm ${
        isCurrent
          ? 'border-accent-400 dark:border-accent-600'
          : 'hairline hover:border-accent-300 dark:hover:border-accent-700'
      }`}
    >
      <span className="flex items-baseline justify-between gap-1">
        <span className="text-[13px] font-medium">{name}</span>
        {total > 0 && <span className="muted text-[11px] tabular-nums">{total}</span>}
      </span>
      <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
        <span
          className="block h-full rounded-full bg-accent-500 transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </span>
    </button>
  );
}
