import { forwardRef } from 'react';
import type { Item } from '../types';
import { fullStamp, stamp } from '../lib/time';
import { ChevronRightIcon } from './icons';
import { NoteText } from './NoteText';
import { NoteRow } from './NoteRow';
import { InlineComposer } from './InlineComposer';
import { QuartzMark } from './QuartzMark';

interface Props {
  note: Item;
  ancestors: Item[];
  children: Item[];
  now: number;
  countBelow: (id: string) => number;
  onOpenNote: (id: string) => void;
  onOpenMonth: () => void;
  onCapture: (text: string) => void;
  onToggle: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  onToggleTimer: (id: string, timerId: string) => void;
  onResetTimer: (id: string, timerId: string) => void;
}

/**
 * One note, on its own page, with whatever elaborates on it underneath.
 *
 * There is nothing special about an elaboration: it's a note, so it has its
 * own page too, and you can carry on down as far as the thought goes. The
 * writing line at the bottom is the same one as on a month page — writing is
 * writing wherever you are.
 */
export const NotePage = forwardRef<HTMLTextAreaElement, Props>(function NotePage(
  {
    note,
    ancestors,
    children,
    now,
    countBelow,
    onOpenNote,
    onOpenMonth,
    onCapture,
    onToggle,
    onEdit,
    onRemove,
    onToggleTimer,
    onResetTimer,
  },
  composerRef,
) {
  return (
    <article className="surface hairline group relative overflow-hidden rounded-3xl border shadow-sheet">
      <QuartzMark className="pointer-events-none absolute -right-6 -top-8 hidden h-32 w-32 rotate-6 text-accent-500/[0.05] transition-transform duration-700 group-hover:rotate-0 sm:block" />

      <header className="hairline relative border-b px-4 py-5 sm:px-6 sm:py-6">
        {/* Where this sits in the thought, and the way back up it. */}
        <nav className="muted flex flex-wrap items-center gap-1 text-[11px]">
          <button
            type="button"
            onClick={onOpenMonth}
            className="rounded transition hover:text-[rgb(var(--text))]"
          >
            The page
          </button>
          {ancestors.map((ancestor) => (
            <span key={ancestor.id} className="flex items-center gap-1">
              <ChevronRightIcon className="h-3 w-3 opacity-50" />
              <button
                type="button"
                onClick={() => onOpenNote(ancestor.id)}
                className="max-w-[12rem] truncate rounded transition hover:text-[rgb(var(--text))]"
              >
                {ancestor.text}
              </button>
            </span>
          ))}
        </nav>

        <div className="mt-3 flex items-start gap-3">
          <button
            type="button"
            role="checkbox"
            aria-checked={note.done}
            onClick={() => onToggle(note.id)}
            aria-label={note.done ? 'Mark as not done' : 'Mark as done'}
            className="-m-2 shrink-0 p-2"
          >
            <span
              className={`mt-1 flex h-[22px] w-[22px] items-center justify-center rounded-[7px] border-[1.5px] transition duration-200 ${
                note.done
                  ? 'animate-check-pop border-accent-600 bg-accent-600 text-white dark:border-accent-500 dark:bg-accent-500'
                  : 'hairline hover:border-accent-400'
              }`}
            >
              {note.done && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-[14px] w-[14px]" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7" />
                </svg>
              )}
            </span>
          </button>

          <div className="min-w-0 flex-1">
            <h1
              className={`font-display text-[24px] leading-tight tracking-tight sm:text-[28px] ${
                note.done ? 'muted line-through decoration-1' : ''
              }`}
            >
              <NoteText
                item={note}
                now={now}
                onToggleTimer={(timerId) => onToggleTimer(note.id, timerId)}
                onResetTimer={(timerId) => onResetTimer(note.id, timerId)}
              />
            </h1>
            <p className="muted mt-2 text-[11px] tabular-nums" title={fullStamp(note.createdAt)}>
              {stamp(note.createdAt)}
              {children.length > 0 &&
                ` · ${countBelow(note.id)} ${countBelow(note.id) === 1 ? 'note' : 'notes'} below`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onRemove(note.id)}
            className="hairline muted shrink-0 rounded-full border px-3 py-1.5 text-[12px] transition hover:border-red-400 hover:text-red-600 dark:hover:text-red-400"
          >
            Delete
          </button>
        </div>
      </header>

      <div className="px-1 py-3 sm:px-2">
        {children.length === 0 && (
          <p className="muted px-4 py-6 text-center text-[13px] leading-relaxed sm:px-6">
            Nothing under this yet. Write below to take the idea further — and each of those can be
            opened and taken further again.
          </p>
        )}

        <ul>
          {children.map((child) => (
            <NoteRow
              key={child.id}
              item={child}
              now={now}
              below={countBelow(child.id)}
              onOpen={() => onOpenNote(child.id)}
              onToggle={() => onToggle(child.id)}
              onEdit={(text) => onEdit(child.id, text)}
              onRemove={() => onRemove(child.id)}
              onToggleTimer={(timerId) => onToggleTimer(child.id, timerId)}
              onResetTimer={(timerId) => onResetTimer(child.id, timerId)}
            />
          ))}
        </ul>

        <InlineComposer ref={composerRef} onCapture={onCapture} placeholder="Take it further…" />
      </div>
    </article>
  );
});
