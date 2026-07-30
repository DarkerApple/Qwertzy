import { forwardRef } from 'react';
import { CloseIcon, SearchIcon } from './icons';

interface Props {
  query: string;
  onQuery: (query: string) => void;
  onClose: () => void;
  resultCount: number;
}

/**
 * Search spans every month, so it takes over the page while it's open rather
 * than sitting permanently in the chrome.
 */
export const SearchBar = forwardRef<HTMLInputElement, Props>(function SearchBar(
  { query, onQuery, onClose, resultCount },
  ref,
) {
  return (
    <div
      className="sticky z-20 border-b backdrop-blur-md"
      style={{
        top: 'var(--header-h)',
        backgroundColor: 'rgb(var(--paper) / 0.82)',
        borderColor: 'rgb(var(--line))',
      }}
    >
      <div className="mx-auto flex max-w-2xl items-center gap-2 px-3 py-2 sm:px-4">
        <div className="surface hairline flex flex-1 items-center gap-2 rounded-xl border px-3 py-1.5 focus-within:border-accent-400">
          <SearchIcon className="muted h-4 w-4 shrink-0" />
          <input
            ref={ref}
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
            }}
            placeholder="Search every month…"
            aria-label="Search notes and threads"
            className="w-full bg-transparent text-[15px] placeholder:text-ink-400 focus:outline-none dark:placeholder:text-ink-500 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <span className="muted shrink-0 text-[11px] tabular-nums">{resultCount}</span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="muted flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition hover:text-[rgb(var(--text))]"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
});
