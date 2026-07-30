import { useLayoutEffect, useRef, useState } from 'react';
import type { Item } from '../types';
import { dayLabel, fullStamp, isToday, timeLabel } from '../lib/time';
import { CheckIcon, ThreadIcon, TrashIcon } from './icons';
import { NoteText } from './NoteText';

interface Props {
  item: Item;
  now: number;
  /** How many notes hang off this one, all the way down. */
  below: number;
  onOpen: () => void;
  onToggle: () => void;
  onEdit: (text: string) => void;
  onRemove: () => void;
  onToggleTimer: (timerId: string) => void;
  onResetTimer: (timerId: string) => void;
  /** A little air where the day changes — grouping without a heading. */
  startsNewDay?: boolean;
}

/**
 * One line of a page. Tapping it opens that note on its own page, where it can
 * be elaborated on — and each elaboration is a line like this one, so it opens
 * too. That's the whole structure; there's no second kind of thing.
 */
export function NoteRow({
  item,
  now,
  below,
  onOpen,
  onToggle,
  onEdit,
  onRemove,
  onToggleTimer,
  onResetTimer,
  startsNewDay,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);
  const editRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const el = editRef.current;
    if (!editing || !el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [editing, draft]);

  useLayoutEffect(() => {
    if (!editing) return;
    const el = editRef.current;
    el?.focus();
    el?.setSelectionRange(el.value.length, el.value.length);
  }, [editing]);

  function commitEdit() {
    setEditing(false);
    if (draft.trim() && draft.trim() !== item.text) onEdit(draft);
    else setDraft(item.text);
  }

  const when = item.done && item.doneAt ? item.doneAt : item.createdAt;

  return (
    <li className={`group animate-fade-in rounded-lg transition-colors ${startsNewDay ? 'mt-4' : ''}`}>
      <div className="flex items-start gap-3 px-3 py-1.5 sm:px-4">
        <button
          type="button"
          role="checkbox"
          aria-checked={item.done}
          onClick={onToggle}
          aria-label={item.done ? `Mark "${item.text}" as not done` : `Mark "${item.text}" as done`}
          // 44px hit area around a 22px box: comfortable on a phone, tidy on screen.
          className="-m-2.5 shrink-0 p-2.5"
        >
          <span
            className={`flex h-[22px] w-[22px] items-center justify-center rounded-[7px] border-[1.5px] transition duration-200 ${
              item.done
                ? 'animate-check-pop border-accent-600 bg-accent-600 text-white dark:border-accent-500 dark:bg-accent-500'
                : 'hairline group-hover:scale-105 group-hover:border-accent-400'
            }`}
          >
            {item.done && <CheckIcon className="h-[14px] w-[14px]" />}
          </span>
        </button>

        <div className="min-w-0 flex-1">
          {editing ? (
            <textarea
              ref={editRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  commitEdit();
                }
                if (e.key === 'Escape') {
                  setDraft(item.text);
                  setEditing(false);
                }
              }}
              rows={1}
              aria-label="Edit note"
              className="hairline w-full resize-none rounded-lg border bg-transparent px-2 py-1 text-[15px] leading-relaxed focus:border-accent-400 focus:outline-none"
            />
          ) : (
            // Not a <button>: a note can contain timer chips and graphs, which
            // are interactive themselves, and buttons don't nest.
            <div
              role="button"
              tabIndex={0}
              onClick={onOpen}
              onDoubleClick={() => {
                setDraft(item.text);
                setEditing(true);
              }}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpen();
                }
              }}
              aria-label={`Open “${item.text}”`}
              className="block w-full cursor-pointer text-left"
            >
              <NoteText
                item={item}
                now={now}
                onToggleTimer={onToggleTimer}
                onResetTimer={onResetTimer}
                className={`block whitespace-pre-wrap break-words text-[15px] leading-relaxed transition-colors ${
                  item.done ? 'muted line-through decoration-1' : ''
                }`}
              />
            </div>
          )}

          {below > 0 && (
            <button
              type="button"
              onClick={onOpen}
              className="mt-1 flex items-center gap-1 text-[11px] font-medium text-accent-700 transition hover:underline dark:text-accent-300"
            >
              <ThreadIcon className="h-[13px] w-[13px]" />
              {below} below
            </button>
          )}
        </div>

        {/* The time in a fixed margin column so stamps line up down the page. */}
        <div className="flex shrink-0 items-start gap-1 pt-0.5">
          <time
            className="muted w-16 text-right text-[11px] leading-4 tabular-nums"
            dateTime={new Date(when).toISOString()}
            title={
              item.done && item.doneAt
                ? `Done ${fullStamp(item.doneAt)} · added ${fullStamp(item.createdAt)}`
                : fullStamp(item.createdAt)
            }
          >
            {timeLabel(when)}
            {!isToday(when, now) && (
              <span className="block text-[10px] opacity-70">{dayLabel(when, now)}</span>
            )}
          </time>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Delete "${item.text}"`}
            className="hover-reveal muted -mr-1 hidden rounded-lg p-1.5 transition hover:bg-red-500/10 hover:text-red-600 sm:block dark:hover:text-red-400"
          >
            <TrashIcon className="h-[15px] w-[15px]" />
          </button>
        </div>
      </div>
    </li>
  );
}
