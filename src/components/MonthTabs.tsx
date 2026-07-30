import { useEffect, useRef } from 'react';
import type { MonthSummary } from '../lib/group';
import { monthLabel, monthLabelShort } from '../lib/time';

interface Props {
  months: MonthSummary[];
  activeKey: string;
  onSelect: (key: string) => void;
}

/**
 * The app's navigation: one tab per month, oldest on the left so time runs the
 * way you read. The active tab is always scrolled into view, which matters on a
 * phone where only three or four fit at once.
 */
export function MonthTabs({ months, activeKey, onSelect }: Props) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [activeKey, months.length]);

  return (
    <div
      className="sticky z-20 border-b"
      style={{ top: 'var(--header-h)', backgroundColor: 'rgb(var(--paper))', borderColor: 'rgb(var(--line))' }}
    >
      <div
        ref={listRef}
        role="tablist"
        aria-label="Months"
        className="no-scrollbar mx-auto flex max-w-2xl gap-1 overflow-x-auto px-3 sm:px-4"
        style={{ height: 'var(--tabs-h)' }}
      >
        {months.map((month) => {
          const active = month.key === activeKey;
          return (
            <button
              key={month.key}
              ref={active ? activeRef : undefined}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onSelect(month.key)}
              title={monthLabel(month.key)}
              className={`group relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 text-[13px] font-medium transition-colors ${
                active ? '' : 'muted hover:text-[rgb(var(--text))]'
              }`}
            >
              {monthLabelShort(month.key)}
              {month.open > 0 && (
                <span
                  className={`rounded-full px-1.5 py-px text-[11px] tabular-nums transition-colors ${
                    active
                      ? 'bg-accent-600 text-white dark:bg-accent-500'
                      : 'bg-ink-200/70 text-ink-600 dark:bg-ink-800 dark:text-ink-300'
                  }`}
                >
                  {month.open}
                </span>
              )}
              {/* The underline is the selection, so tabs stay quiet when idle. */}
              <span
                aria-hidden="true"
                className={`absolute inset-x-2 bottom-0 h-[2px] rounded-full transition-opacity ${
                  active ? 'bg-accent-600 opacity-100 dark:bg-accent-400' : 'opacity-0'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
