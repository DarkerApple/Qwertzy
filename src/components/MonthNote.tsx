import type { ReactNode } from 'react';
import type { Item } from '../types';
import type { MonthSummary } from '../lib/group';
import { monthLabel } from '../lib/time';
import { QuartzMark } from './QuartzMark';

interface Props {
  monthKey: string;
  summary?: MonthSummary;
  items: Item[];
  /** Renders one line; the sheet owns layout, the caller owns behaviour. */
  renderItem: (item: Item, index: number) => ReactNode;
  /** Shown on the page itself when there's nothing to rule out. */
  empty?: ReactNode;
  /** The writing line, kept at the bottom of the page. */
  footer?: ReactNode;
  children?: ReactNode;
}

/**
 * A month as a single sheet of paper — one note you keep adding to, not a stack
 * of small ones. There are no day headings: each line carries its own time in
 * the margin, and a day change just gets a little more air.
 */
export function MonthNote({
  monthKey: key,
  summary,
  items,
  renderItem,
  empty,
  footer,
  children,
}: Props) {
  const total = summary?.total ?? 0;
  const done = summary?.done ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <article className="surface hairline group relative overflow-hidden rounded-3xl border shadow-sheet">
      {/* Always there, faintly — the page's own bit of quartz. */}
      <QuartzMark className="pointer-events-none absolute -right-6 -top-8 hidden h-32 w-32 rotate-6 text-accent-500/[0.05] transition-transform duration-700 group-hover:rotate-0 sm:block" />
      <header className="hairline relative border-b px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-[28px] leading-none tracking-tight sm:text-[32px]">
              {monthLabel(key)}
            </h1>
            <p className="muted mt-1.5 text-[12px]">
              {total === 0
                ? 'Nothing on this page yet'
                : `${total} ${total === 1 ? 'note' : 'notes'} · ${done} done${
                    summary?.threads ? ` · ${summary.threads} with threads` : ''
                  }`}
            </p>
          </div>
          {total > 0 && (
            <div className="shrink-0 text-right">
              <span className="font-display text-[22px] leading-none tabular-nums">{pct}%</span>
              <div className="mt-1.5 h-1 w-20 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
                <div
                  className="h-full rounded-full bg-accent-600 transition-[width] duration-500 dark:bg-accent-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
        {children}
      </header>

      <div className="px-1 py-3 sm:px-2">
        {items.length === 0 && empty}
        <ul>{items.map((item, i) => renderItem(item, i))}</ul>
        {footer}
      </div>
    </article>
  );
}
