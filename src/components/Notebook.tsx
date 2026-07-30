import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Filter, Item } from '../types';
import { useNotebook } from '../hooks/useNotebook';
import { byMonth, filterItems, inMonth, inWrittenOrder, monthSummaries, startsNewDay } from '../lib/group';
import type { MonthSummary } from '../lib/group';
import { currentMonthKey, monthLabel } from '../lib/time';
import type { NotebookStorage } from '../lib/storage';
import { exportJSON, parseImport } from '../lib/storage';
import { describeDuration, hasTimer, withoutTimerTokens } from '../lib/timer';
import { ensurePermission, notifyTimerDone } from '../lib/notify';
import { TimerToast } from './TimerToast';
import { InlineComposer } from './InlineComposer';
import { MonthTabs } from './MonthTabs';
import { MonthNote } from './MonthNote';
import { NoteRow } from './NoteRow';
import { FilterTabs } from './FilterTabs';
import { SearchBar } from './SearchBar';
import { EmptyState } from './EmptyState';
import { UndoToast } from './UndoToast';
import { Menu } from './Menu';
import { MonthAside } from './MonthAside';
import { ChartIcon, ChevronLeftIcon, ChevronRightIcon, HomeIcon, LockIcon, SearchIcon, SlidersIcon } from './icons';

const EMPTY_MONTH = (key: string): MonthSummary => ({ key, total: 0, done: 0, open: 0, threads: 0 });

interface Props {
  storage: NotebookStorage;
  /** Which month to open on; the notebook takes it from there. */
  initialMonth?: string;
  onMonthChange?: (key: string) => void;
  onHome: () => void;
  /** The secret notebook says so, and can be shut again. */
  secret?: boolean;
  onLock?: () => void;
  onOpenSettings: () => void;
  onOpenVisualize: (month: string) => void;
  /** Runs what was written through any enabled plugins first. */
  applyCapture?: (text: string) => Promise<string[]>;
  /** Notes handed over from elsewhere — a plugin command, say. */
  incoming?: string[];
  onIncomingHandled?: () => void;
  chrome: React.ReactNode;
}

/**
 * A whole notebook: month tabs, the month's page, writing, search, timers.
 *
 * It knows nothing about where its notes are kept — the everyday notebook and
 * the password-protected one are the same screen over different storage.
 */
export function Notebook({
  storage,
  initialMonth,
  onMonthChange,
  onHome,
  secret = false,
  onLock,
  onOpenSettings,
  onOpenVisualize,
  applyCapture,
  incoming,
  onIncomingHandled,
  chrome,
}: Props) {
  const {
    items,
    capture,
    toggle,
    edit,
    remove,
    lastRemoved,
    undoRemove,
    dismissUndo,
    reply,
    removeReply,
    promoteReply,
    toggleTimer,
    resetTimer,
    finishTimer,
    clearDone,
    replaceAll,
  } = useNotebook(storage);

  const thisMonth = currentMonthKey();
  const [activeMonth, setActiveMonth] = useState(initialMonth ?? thisMonth);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [rang, setRang] = useState<{ id: string; text: string; label: string | null }[]>([]);

  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const justCaptured = useRef(false);
  const announced = useRef(new Set<string>());

  // The current month always has a page, even before anything is written on it.
  const months = useMemo(() => {
    const list = monthSummaries(items);
    if (!list.some((m) => m.key === thisMonth)) list.push(EMPTY_MONTH(thisMonth));
    return list.sort((a, b) => a.key.localeCompare(b.key));
  }, [items, thisMonth]);

  // A month can disappear when its last item is deleted — land somewhere real.
  useEffect(() => {
    if (!months.some((m) => m.key === activeMonth)) {
      setActiveMonth(months[months.length - 1]?.key ?? thisMonth);
    }
  }, [months, activeMonth, thisMonth]);

  // Keep the URL on the month being read, so back and reload land where you were.
  useEffect(() => {
    onMonthChange?.(activeMonth);
  }, [activeMonth, onMonthChange]);

  const summary = months.find((m) => m.key === activeMonth);
  const monthItems = useMemo(() => inMonth(items, activeMonth), [items, activeMonth]);

  const counts = useMemo(() => {
    const done = monthItems.filter((i) => i.done).length;
    return { all: monthItems.length, open: monthItems.length - done, done };
  }, [monthItems]);

  const trimmedQuery = query.trim();
  const searchMode = searching && trimmedQuery.length > 0;

  const pageItems = useMemo(
    () => inWrittenOrder(filterItems(monthItems, filter, '')),
    [monthItems, filter],
  );

  const running = useMemo(
    () => items.some((item) => item.timers.some((timer) => timer.state === 'running')),
    [items],
  );

  // One clock for the whole page, ticking only while something is counting.
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [running]);

  // A timer reaching zero: mark it done, then say so. Timers that expired while
  // the tab was closed are simply shown as finished — a notification for
  // something that ended hours ago would be noise, not news.
  useEffect(() => {
    for (const item of items) {
      for (const timer of item.timers) {
        if (timer.state !== 'running' || timer.endsAt === null || timer.endsAt > now) continue;
        finishTimer(item.id, timer.id);
        if (announced.current.has(timer.id)) continue;
        announced.current.add(timer.id);
        const fresh = now - timer.endsAt < 60_000;
        if (!fresh) continue;
        const title = timer.label ?? `${describeDuration(timer.seconds)} timer`;
        const body = withoutTimerTokens(item.text);
        notifyTimerDone(`⏱ ${title}`, body);
        setRang((prev) => [...prev, { id: timer.id, text: body, label: timer.label }]);
      }
    }
  }, [items, now, finishTimer]);

  const results = useMemo(() => {
    if (!searchMode) return [];
    return byMonth(filterItems(items, filter, trimmedQuery));
  }, [items, filter, trimmedQuery, searchMode]);
  const resultCount = results.reduce((sum, group) => sum + group.items.length, 0);

  const textById = useMemo(() => new Map(items.map((i) => [i.id, i.text])), [items]);

  /** Writing happens on the current month's page, so go there first. */
  const focusComposer = useCallback(() => {
    setActiveMonth(thisMonth);
    setSearching(false);
    requestAnimationFrame(() => {
      composerRef.current?.focus();
      composerRef.current?.scrollIntoView({ block: 'center' });
    });
  }, [thisMonth]);

  function handleCapture(text: string) {
    if (applyCapture) {
      void applyCapture(text).then((pieces) => {
        // A plugin returning nothing usable must not swallow what was written.
        const notes = pieces.length ? pieces : [text];
        for (const note of notes) capture(note);
        afterCapture(text);
      });
      return;
    }
    const added = capture(text);
    if (!added) return;
    afterCapture(text);
  }

  function afterCapture(text: string) {
    // Writing a timer starts it, so this is the moment to ask about
    // notifications — inside the keystroke that started it.
    if (hasTimer(text)) void ensurePermission();
    setNow(Date.now());
    setSearching(false);
    setQuery('');
    // A note written under a "Done" filter would vanish as you wrote it.
    setFilter('all');
    justCaptured.current = true;
  }

  // Notes handed over from a plugin command: add them once, then tell the
  // sender they've landed so a re-render can't add them twice.
  useEffect(() => {
    if (!incoming || incoming.length === 0) return;
    for (const note of incoming) capture(note);
    setActiveMonth(thisMonth);
    setFilter('all');
    justCaptured.current = true;
    onIncomingHandled?.();
  }, [incoming, capture, thisMonth, onIncomingHandled]);

  // Writing happens at the bottom of the page — keep the line you're on in view
  // as the page grows above it.
  useEffect(() => {
    if (!justCaptured.current) return;
    justCaptured.current = false;
    requestAnimationFrame(() => composerRef.current?.scrollIntoView({ block: 'center' }));
  }, [items]);

  const step = useCallback(
    (direction: -1 | 1) => {
      const index = months.findIndex((m) => m.key === activeMonth);
      const next = months[index + direction];
      if (!next) return;
      setActiveMonth(next.key);
      setExpandedId(null);
      window.scrollTo({ top: 0 });
    },
    [months, activeMonth],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '');
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (typing) {
        if (e.key === 'Escape' && searching) setSearching(false);
        return;
      }
      if (e.key === 'n' || e.key === 'c') {
        e.preventDefault();
        focusComposer();
      } else if (e.key === '/') {
        e.preventDefault();
        setSearching(true);
        requestAnimationFrame(() => searchRef.current?.focus());
      } else if (e.key === 'ArrowLeft') {
        step(-1);
      } else if (e.key === 'ArrowRight') {
        step(1);
      } else if (e.key === 'Escape') {
        if (expandedId) setExpandedId(null);
        else if (searching) setSearching(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusComposer, step, expandedId, searching]);

  // Swipe left/right to change month — the gesture a phone user reaches for.
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  }
  function onTouchEnd(e: React.TouchEvent) {
    const start = touch.current;
    touch.current = null;
    if (!start || searchMode) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    // Horizontal, decisive, and clearly not a scroll.
    if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 2 || Date.now() - start.t > 600) return;
    step(dx < 0 ? 1 : -1);
  }

  function handleExport() {
    const blob = new Blob([exportJSON(items)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qwertzy-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File) {
    const parsed = parseImport(await file.text());
    if (!parsed) {
      window.alert("That file doesn't look like a Qwertzy backup.");
      return;
    }
    const ok = window.confirm(
      `Replace your ${items.length} current ${items.length === 1 ? 'item' : 'items'} with ${parsed.length} from this backup?`,
    );
    if (ok) replaceAll(parsed);
  }

  const renderRow = (item: Item, newDay = false) => (
    <NoteRow
      key={item.id}
      item={item}
      now={now}
      expanded={expandedId === item.id}
      startsNewDay={newDay}
      onToggleExpand={() => setExpandedId((current) => (current === item.id ? null : item.id))}
      onToggle={() => toggle(item.id)}
      onEdit={(text) => edit(item.id, text)}
      onRemove={() => remove(item.id)}
      onReply={(text) => reply(item.id, text)}
      onRemoveReply={(replyId) => removeReply(item.id, replyId)}
      onPromoteReply={(replyId) => promoteReply(item.id, replyId)}
      onToggleTimer={(timerId) => {
        void ensurePermission();
        setNow(Date.now());
        toggleTimer(item.id, timerId);
      }}
      onResetTimer={(timerId) => resetTimer(item.id, timerId)}
      parentText={item.parentId ? textById.get(item.parentId) : undefined}
    />
  );

  const index = months.findIndex((m) => m.key === activeMonth);
  const isEmptyEverywhere = items.length === 0;

  return (
    <div className="page">
      <header
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{ height: 'var(--header-h)', backgroundColor: 'rgb(var(--paper) / 0.82)' }}
      >
        <div className="mx-auto flex h-full max-w-2xl items-center gap-1 px-3 sm:px-4">
          <button
            type="button"
            onClick={onHome}
            aria-label="All years"
            className="muted flex h-9 items-center gap-1.5 rounded-xl pl-1 pr-2 transition hover:text-[rgb(var(--text))]"
          >
            <HomeIcon className="h-[18px] w-[18px]" />
            <span className="text-[13px] font-medium">Years</span>
          </button>

          {secret && (
            <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
              <LockIcon className="h-3 w-3" />
              Secret
            </span>
          )}

          <div className="ml-auto flex items-center gap-0.5">
            {/* Month arrows are pointer-friendly; touch users swipe or tap a tab. */}
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={index <= 0}
              aria-label="Previous month"
              className="muted hidden h-9 w-9 items-center justify-center rounded-xl transition hover:text-[rgb(var(--text))] disabled:opacity-25 sm:flex"
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={index >= months.length - 1}
              aria-label="Next month"
              className="muted hidden h-9 w-9 items-center justify-center rounded-xl transition hover:text-[rgb(var(--text))] disabled:opacity-25 sm:flex"
            >
              <ChevronRightIcon />
            </button>
            <button
              type="button"
              onClick={() => {
                setSearching((v) => !v);
                requestAnimationFrame(() => searchRef.current?.focus());
              }}
              aria-label="Search"
              aria-pressed={searching}
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                searching ? 'text-accent-700 dark:text-accent-300' : 'muted hover:text-[rgb(var(--text))]'
              }`}
            >
              <SearchIcon />
            </button>
            {secret && onLock && (
              <button
                type="button"
                onClick={onLock}
                className="flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-[13px] font-medium text-amber-700 transition hover:bg-amber-500/10 dark:text-amber-300"
              >
                <LockIcon className="h-4 w-4" />
                Lock
              </button>
            )}
            {chrome}
            <button
              type="button"
              onClick={() => onOpenVisualize(activeMonth)}
              aria-label="Visualise this month"
              title="Visualise this month"
              className="muted flex h-9 w-9 items-center justify-center rounded-xl transition duration-200 hover:text-[rgb(var(--text))]"
            >
              <ChartIcon />
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Settings"
              className="muted flex h-9 w-9 items-center justify-center rounded-xl transition duration-200 hover:rotate-45 hover:text-[rgb(var(--text))]"
            >
              <SlidersIcon />
            </button>
            <Menu
              doneCount={items.filter((i) => i.done).length}
              onClearDone={clearDone}
              // Backups would write the secret notes to disk in the clear, so
              // the encrypted notebook doesn't offer them.
              allowBackup={!secret}
              onExport={handleExport}
              onImport={handleImport}
            />
          </div>
        </div>
      </header>

      {searching ? (
        <SearchBar
          ref={searchRef}
          query={query}
          onQuery={setQuery}
          onClose={() => {
            setSearching(false);
            setQuery('');
          }}
          resultCount={resultCount}
        />
      ) : (
        <MonthTabs
          months={months}
          activeKey={activeMonth}
          onSelect={(key) => {
            setActiveMonth(key);
            setExpandedId(null);
            window.scrollTo({ top: 0 });
          }}
        />
      )}

      <main
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="mx-auto w-full max-w-2xl px-4 pb-14 pt-5 sm:px-5 sm:pt-6 lg:max-w-6xl"
      >
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start lg:gap-6">
          <div className="min-w-0">
        {searchMode ? (
          <div className="space-y-4">
            <p className="muted px-1 text-[12px]">
              {resultCount} {resultCount === 1 ? 'match' : 'matches'} for “{trimmedQuery}”
            </p>
            {results.length === 0 ? (
              <div className="surface hairline rounded-3xl border shadow-sheet">
                <EmptyState kind="search" />
              </div>
            ) : (
              results.map((group) => (
                <section key={group.key} className="surface hairline overflow-hidden rounded-3xl border shadow-sheet">
                  <h2 className="hairline border-b px-4 py-3 font-display text-[19px] sm:px-6">
                    {monthLabel(group.key)}
                  </h2>
                  <ul className="px-1 py-2 sm:px-2">
                    {group.items.map((item) => renderRow(item))}
                  </ul>
                </section>
              ))
            )}
          </div>
        ) : (
          <MonthNote
            monthKey={activeMonth}
            summary={summary}
            items={pageItems}
            renderItem={(item, i) => renderRow(item, startsNewDay(pageItems, i))}
            empty={
              <EmptyState
                kind={isEmptyEverywhere ? 'fresh' : counts.all === 0 ? 'month' : 'filtered'}
                onReset={() => setFilter('all')}
              />
            }
            footer={
              activeMonth === thisMonth ? (
                <InlineComposer ref={composerRef} onCapture={handleCapture} />
              ) : (
                // Older pages are read-only: writing always belongs to today.
                <button
                  type="button"
                  onClick={focusComposer}
                  className="muted w-full px-4 py-4 text-left text-[13px] transition hover:text-[rgb(var(--text))] sm:px-6"
                >
                  Write on {monthLabel(thisMonth)}’s page →
                </button>
              )
            }
          >
            {counts.all > 0 && <FilterTabs filter={filter} onFilter={setFilter} counts={counts} />}
          </MonthNote>
        )}

          </div>

          {!searchMode && (
            <MonthAside
              monthKey={activeMonth}
              summary={summary}
              items={monthItems}
              now={now}
              onToggleTimer={(itemId, timerId) => {
                setNow(Date.now());
                toggleTimer(itemId, timerId);
              }}
              onOpenItem={(id) => setExpandedId(id)}
            />
          )}
        </div>

        {!searchMode && (
          <p className="muted mt-6 text-center text-[11px]">
            <span className="hidden sm:inline">← → for months · N to write · / to search · </span>
            <span className="sm:hidden">Swipe left or right for other months · </span>
            write <span className="font-medium">time(10m)</span> for a timer
          </p>
        )}
      </main>

      <div
        className="pointer-events-none fixed inset-x-0 z-40 flex flex-col items-center gap-2 px-3"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
      >
        {rang.map((ring) => (
          <TimerToast
            key={ring.id}
            text={ring.text}
            label={ring.label}
            onDismiss={() => setRang((prev) => prev.filter((r) => r.id !== ring.id))}
          />
        ))}
        {lastRemoved && (
          <UndoToast text={lastRemoved.item.text} onUndo={undoRemove} onDismiss={dismissUndo} />
        )}
      </div>
    </div>
  );
}
