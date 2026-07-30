import { useLayoutEffect, useRef, useState } from 'react';
import type { Item } from '../types';
import { dayLabel, fullStamp, isToday, timeLabel } from '../lib/time';
import { CheckIcon, ThreadIcon, TrashIcon } from './icons';
import { NoteText } from './NoteText';
import { Thread } from './Thread';

interface Props {
  item: Item;
  expanded: boolean;
  now: number;
  onToggleExpand: () => void;
  onToggle: () => void;
  onEdit: (text: string) => void;
  onRemove: () => void;
  onReply: (text: string) => void;
  onRemoveReply: (replyId: string) => void;
  onPromoteReply: (replyId: string) => void;
  onToggleTimer: (timerId: string) => void;
  onResetTimer: (timerId: string) => void;
  /** Shown when this item was split out of another item's thread. */
  parentText?: string;
  /** A little air where the day changes — grouping without a heading. */
  startsNewDay?: boolean;
}

/**
 * One line of the month's note. No rules between lines and no boxes: the page
 * is one long note, and each line just happens to carry a checkbox and a time.
 *
 * Tapping the line opens its thread — the one primary action, and the only one
 * that works identically with a finger and a mouse. Edit and delete live inside
 * that panel so nothing depends on hover.
 */
export function NoteRow({
  item,
  expanded,
  now,
  onToggleExpand,
  onToggle,
  onEdit,
  onRemove,
  onReply,
  onRemoveReply,
  onPromoteReply,
  onToggleTimer,
  onResetTimer,
  parentText,
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

  function startEditing() {
    setDraft(item.text);
    setEditing(true);
  }

  function commitEdit() {
    setEditing(false);
    if (draft.trim() && draft.trim() !== item.text) onEdit(draft);
    else setDraft(item.text);
  }

  const when = item.done && item.doneAt ? item.doneAt : item.createdAt;

  return (
    <li
      className={`group animate-fade-in rounded-lg transition-colors ${expanded ? 'rowtint' : ''} ${
        startsNewDay ? 'mt-4' : ''
      }`}
    >
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
            className={`flex h-[22px] w-[22px] items-center justify-center rounded-[7px] border-[1.5px] transition ${
              item.done
                ? 'border-accent-600 bg-accent-600 text-white dark:border-accent-500 dark:bg-accent-500'
                : 'hairline group-hover:border-accent-400'
            }`}
          >
            {item.done && <CheckIcon className="h-[14px] w-[14px]" />}
          </span>
        </button>

        <div className="min-w-0 flex-1">
          {parentText && (
            <p className="muted mb-0.5 truncate text-[11px]" title={`Split out of: ${parentText}`}>
              ↳ from “{parentText}”
            </p>
          )}

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
              aria-label="Edit item"
              className="hairline w-full resize-none rounded-lg border bg-transparent px-2 py-1 text-[15px] leading-relaxed focus:border-accent-400 focus:outline-none"
            />
          ) : (
            // Not a <button>: a note can contain timer chips, which are
            // buttons themselves, and buttons don't nest.
            <div
              role="button"
              tabIndex={0}
              onClick={onToggleExpand}
              onDoubleClick={startEditing}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggleExpand();
                }
              }}
              aria-expanded={expanded}
              // Named explicitly: otherwise the name is built from the contents
              // and would swallow the timer chips' own button labels.
              aria-label={`Thread for “${item.text}”`}
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

          {(item.replies.length > 0 || expanded) && (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-accent-700 dark:text-accent-300">
              <ThreadIcon className="h-[13px] w-[13px]" />
              {item.replies.length > 0
                ? `${item.replies.length} in thread`
                : 'Thread — say more about this'}
            </p>
          )}
        </div>

        {/* The margin carries the time, and the date underneath it only when
            it isn't today — which is why the page needs no day headings. */}
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
          {/* Shortcut for pointer users; touch users get the same action below. */}
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

      {expanded && (
        <div className="animate-slide-up px-3 pb-3 sm:px-4">
          <Thread
            item={item}
            onReply={onReply}
            onRemoveReply={onRemoveReply}
            onPromoteReply={onPromoteReply}
          />
          <div className="mt-2 flex items-center gap-2 pl-9">
            <button
              type="button"
              onClick={startEditing}
              className="hairline muted rounded-full border px-3 py-1.5 text-[12px] transition hover:text-[rgb(var(--text))]"
            >
              Edit note
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="hairline muted rounded-full border px-3 py-1.5 text-[12px] transition hover:border-red-400 hover:text-red-600 dark:hover:text-red-400"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={onToggleExpand}
              className="muted ml-auto rounded-full px-3 py-1.5 text-[12px] transition hover:text-[rgb(var(--text))]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
