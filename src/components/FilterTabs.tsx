import type { Filter } from '../types';

interface Props {
  filter: Filter;
  onFilter: (filter: Filter) => void;
  counts: { all: number; open: number; done: number };
}

const TABS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'To do' },
  { id: 'done', label: 'Done' },
];

/** Segmented control inside the sheet header — which lines of the page to show. */
export function FilterTabs({ filter, onFilter, counts }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Filter notes"
      className="hairline mt-4 flex gap-0.5 rounded-xl border p-0.5"
      style={{ backgroundColor: 'rgb(var(--row))' }}
    >
      {TABS.map((tab) => {
        const active = filter === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onFilter(tab.id)}
            className={`flex-1 rounded-[9px] px-3 py-1.5 text-[13px] font-medium transition ${
              active
                ? 'surface text-[rgb(var(--text))] shadow-sm'
                : 'muted hover:text-[rgb(var(--text))]'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 tabular-nums opacity-60">{counts[tab.id]}</span>
          </button>
        );
      })}
    </div>
  );
}
