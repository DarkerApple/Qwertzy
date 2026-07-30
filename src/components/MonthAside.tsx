import type { Item } from '../types';
import type { MonthSummary } from '../lib/group';
import { formatClock, remainingMs, withoutTimerTokens } from '../lib/timer';
import { monthLabel, timeLabel } from '../lib/time';
import { CheckIcon, ThreadIcon } from './icons';

interface Props {
  monthKey: string;
  summary?: MonthSummary;
  items: Item[];
  now: number;
  onToggleTimer: (itemId: string, timerId: string) => void;
  onOpenItem: (id: string) => void;
}

/**
 * The right-hand rail on wide screens. Everything here is already true of the
 * page beside it — this is the part you'd otherwise have to scroll to work out:
 * how the month is going, what's counting down right now, what you just
 * finished. Below `lg` it isn't rendered at all; the page is the whole story
 * on a phone.
 */
export function MonthAside({
  monthKey,
  summary,
  items,
  now,
  onToggleTimer,
  onOpenItem,
}: Props) {
  const total = summary?.total ?? 0;
  const done = summary?.done ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const running = items.flatMap((item) =>
    item.timers
      .filter((timer) => timer.state === 'running')
      .map((timer) => ({ item, timer })),
  );

  const finished = items
    .filter((item) => item.done && item.doneAt)
    .sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0))
    .slice(0, 4);

  const elaborated = items.filter((item) => items.some((other) => other.parentId === item.id));

  return (
    <aside className="hidden lg:sticky lg:block" style={{ top: 'calc(var(--header-h) + var(--tabs-h) + 20px)' }}>
      <Panel>
        <h2 className="muted text-[10px] font-semibold uppercase tracking-[0.18em]">
          {monthLabel(monthKey)}
        </h2>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-display text-[30px] leading-none tabular-nums">{pct}%</span>
          <span className="muted text-[12px]">
            {done} of {total} done
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
          <div
            className="h-full rounded-full bg-accent-500 transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Notes" value={total} />
          <Stat label="To do" value={summary?.open ?? 0} />
          <Stat label="Deeper" value={elaborated.length} />
        </dl>
      </Panel>

      {running.length > 0 && (
        <Panel className="mt-3">
          <h2 className="muted text-[10px] font-semibold uppercase tracking-[0.18em]">
            Counting down
          </h2>
          <ul className="mt-2.5 space-y-2">
            {running.map(({ item, timer }) => (
              <li key={timer.id}>
                <button
                  type="button"
                  onClick={() => onToggleTimer(item.id, timer.id)}
                  title="Pause"
                  className="hairline flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition hover:border-accent-300 dark:hover:border-accent-700"
                >
                  <span className="font-display shrink-0 text-[17px] tabular-nums text-accent-700 dark:text-accent-300">
                    {formatClock(remainingMs(timer, now))}
                  </span>
                  <span className="muted min-w-0 flex-1 truncate text-[12px]">
                    {timer.label ?? withoutTimerTokens(item.text)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {finished.length > 0 && (
        <Panel className="mt-3">
          <h2 className="muted text-[10px] font-semibold uppercase tracking-[0.18em]">
            Just finished
          </h2>
          <ul className="mt-2.5 space-y-1.5">
            {finished.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onOpenItem(item.id)}
                  className="group flex w-full items-start gap-2 text-left"
                >
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] bg-accent-600 text-white dark:bg-accent-500">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                  <span className="muted min-w-0 flex-1 truncate text-[12px] transition group-hover:text-[rgb(var(--text))]">
                    {withoutTimerTokens(item.text)}
                  </span>
                  <span className="muted shrink-0 text-[10px] tabular-nums">
                    {item.doneAt ? timeLabel(item.doneAt) : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {elaborated.length > 0 && (
        <Panel className="mt-3">
          <h2 className="muted text-[10px] font-semibold uppercase tracking-[0.18em]">Elaborated</h2>
          <ul className="mt-2.5 space-y-1.5">
            {elaborated.slice(0, 4).map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onOpenItem(item.id)}
                  className="group flex w-full items-center gap-2 text-left"
                >
                  <ThreadIcon className="h-3.5 w-3.5 shrink-0 text-accent-700 dark:text-accent-300" />
                  <span className="muted min-w-0 flex-1 truncate text-[12px] transition group-hover:text-[rgb(var(--text))]">
                    {withoutTimerTokens(item.text)}
                  </span>
                  <span className="muted shrink-0 text-[10px] tabular-nums">
                    {items.filter((other) => other.parentId === item.id).length}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </aside>
  );
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`surface hairline rounded-2xl border p-4 shadow-sm ${className}`}>{children}</div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="hairline rounded-xl border py-2">
      <dt className="muted text-[10px] uppercase tracking-wider">{label}</dt>
      <dd className="mt-0.5 text-[15px] font-medium tabular-nums">{value}</dd>
    </div>
  );
}
