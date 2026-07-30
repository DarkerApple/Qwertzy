import { useMemo } from 'react';
import type { Item } from '../types';
import { monthSummaries } from '../lib/group';
import type { MonthSummary } from '../lib/group';
import { currentMonthKey, monthLabel } from '../lib/time';
import { BookIcon, ChevronRightIcon, LockIcon, SlidersIcon, SparkIcon, UnlockIcon } from './icons';
import { QuartzBadge, QuartzMark } from './QuartzMark';

interface Props {
  items: Item[];
  vaultExists: boolean;
  vaultOpen: boolean;
  onOpenMonth: (key: string) => void;
  onOpenGuide: () => void;
  onOpenSecret: () => void;
  onOpenSettings: () => void;
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
  onOpenSettings,
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
  const here = byKey.get(thisMonth);
  const pct = here?.total ? Math.round((here.done / here.total) * 100) : 0;

  return (
    <div className="page">
      <header
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{ height: 'var(--header-h)', backgroundColor: 'rgb(var(--paper) / 0.82)' }}
      >
        <div className="mx-auto flex h-full max-w-2xl items-center gap-2 px-4 sm:px-5">
          <QuartzBadge />
          <span className="text-[15px] font-semibold tracking-tight">Qwertzy</span>
          <div className="ml-auto flex items-center gap-0.5">
            {themeToggle}
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Settings"
              className="muted flex h-9 w-9 items-center justify-center rounded-xl transition duration-200 hover:rotate-45 hover:text-[rgb(var(--text))]"
            >
              <SlidersIcon />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 pb-14 pt-4 sm:px-5">
        <h1 className="font-display text-[34px] leading-[1.05] tracking-tight sm:text-[42px]">
          Your notebooks
        </h1>
        <p className="muted mt-2 text-[13px]">
          {items.length === 0
            ? 'Nothing written yet — start on this month’s page.'
            : `${items.length} ${items.length === 1 ? 'note' : 'notes'} · ${open} still to do`}
        </p>

        {/* The one you almost always want, given the weight to match. */}
        <button
          type="button"
          onClick={() => onOpenMonth(thisMonth)}
          className="surface hairline group relative mt-6 flex w-full items-center gap-4 overflow-hidden rounded-3xl border p-5 text-left shadow-sheet transition duration-200 hover:-translate-y-0.5 hover:border-accent-300 hover:shadow-lift dark:hover:border-accent-700"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-500/[0.07] via-transparent to-transparent"
          />
          {/* The mark, oversized and barely there. Centred on the right edge so
              what shows still reads as a crystal rather than a stray polygon. */}
          <QuartzMark className="pointer-events-none absolute -right-7 top-1/2 hidden h-40 w-40 -translate-y-1/2 text-accent-500/[0.05] transition-transform duration-500 group-hover:scale-105 sm:block" />

          <div className="relative min-w-0 flex-1">
            <p className="muted text-[10px] font-semibold uppercase tracking-[0.18em]">
              This month
            </p>
            <p className="font-display mt-1 text-[27px] leading-none">{monthLabel(thisMonth)}</p>
            <p className="muted mt-2 text-[12px]">
              {here
                ? `${here.total} ${here.total === 1 ? 'note' : 'notes'} · ${here.open} to do`
                : 'A blank page — write something'}
            </p>
            {here && here.total > 0 && (
              <span className="mt-3 block h-[3px] w-32 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
                <span
                  className="block h-full rounded-full bg-accent-500 transition-[width] duration-500"
                  style={{ width: `${pct}%` }}
                />
              </span>
            )}
          </div>
          <ChevronRightIcon className="muted relative h-5 w-5 shrink-0 transition group-hover:translate-x-0.5 group-hover:text-accent-600 dark:group-hover:text-accent-300" />
        </button>

        {years.map((year) => (
          <section key={year} className="mt-9">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="font-display text-[19px] leading-none tracking-tight">{year}</h2>
              <span aria-hidden="true" className="hairline h-px flex-1 border-t" />
            </div>
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

        <div className="mt-9 grid gap-2.5 sm:grid-cols-2">
          <ShelfCard
            onClick={onOpenGuide}
            icon={<BookIcon className="h-[18px] w-[18px]" />}
            tone="accent"
            title="How Qwertzy works"
            subtitle="Writing, timers, threads, months"
          />
          <ShelfCard
            onClick={onOpenSecret}
            icon={
              vaultOpen ? (
                <UnlockIcon className="h-[18px] w-[18px]" />
              ) : (
                <LockIcon className="h-[18px] w-[18px]" />
              )
            }
            tone="amber"
            title="Secret notes"
            subtitle={vaultOpen ? 'Unlocked — open it' : vaultExists ? 'Locked' : 'Set a password'}
          />
        </div>

        <p className="muted mt-9 flex items-center justify-center gap-1.5 text-center text-[11px]">
          <SparkIcon className="h-3.5 w-3.5" />
          Everything is stored in this browser only
        </p>
      </main>
    </div>
  );
}

function ShelfCard({
  onClick,
  icon,
  tone,
  title,
  subtitle,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  tone: 'accent' | 'amber';
  title: string;
  subtitle: string;
}) {
  const hover =
    tone === 'accent'
      ? 'hover:border-accent-300 dark:hover:border-accent-700'
      : 'hover:border-amber-300 dark:hover:border-amber-700/60';
  const chip =
    tone === 'accent'
      ? 'bg-accent-500/10 text-accent-700 dark:text-accent-300'
      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`surface hairline group flex items-center gap-3 rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-sm ${hover}`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${chip}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium">{title}</span>
        <span className="muted block truncate text-[12px]">{subtitle}</span>
      </span>
      <ChevronRightIcon className="muted h-4 w-4 shrink-0 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
    </button>
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
        className={`hairline muted rounded-2xl border border-dashed px-3 py-3 ${
          isFuture ? 'opacity-30' : 'opacity-50'
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
      className={`surface rounded-2xl border px-3 py-3 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
        isCurrent
          ? 'border-accent-400 ring-1 ring-accent-400/40 dark:border-accent-600 dark:ring-accent-600/40'
          : 'hairline hover:border-accent-300 dark:hover:border-accent-700'
      }`}
    >
      <span className="flex items-baseline justify-between gap-1">
        <span className="text-[13px] font-medium">{name}</span>
        {total > 0 && <span className="muted text-[11px] tabular-nums">{total}</span>}
      </span>
      <span className="mt-2 block h-[3px] overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
        <span
          className="block h-full rounded-full bg-accent-500 transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </span>
    </button>
  );
}
