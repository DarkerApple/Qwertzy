import { useLayoutEffect, useRef, useState } from 'react';
import type { Item } from '../types';
import { fullStamp, stamp } from '../lib/time';
import { ArrowUpIcon, PromoteIcon, TrashIcon } from './icons';

interface Props {
  item: Item;
  onReply: (text: string) => void;
  onRemoveReply: (replyId: string) => void;
  onPromoteReply: (replyId: string) => void;
}

/**
 * The thread hanging off one line of the page: where an idea gets talked
 * through. Any message in it can be promoted into its own checklist item.
 */
export function Thread({ item, onReply, onRemoveReply, onPromoteReply }: Props) {
  const [draft, setDraft] = useState('');
  const boxRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [draft]);

  useLayoutEffect(() => {
    // Opening a thread puts the cursor where you'd type next — but only on a
    // pointer device, so phone keyboards don't cover the thread you just opened.
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) boxRef.current?.focus();
  }, []);

  function submit() {
    if (!draft.trim()) return;
    onReply(draft);
    setDraft('');
    boxRef.current?.focus();
  }

  return (
    <div className="ml-[11px] border-l pl-6" style={{ borderColor: 'rgb(var(--line))' }}>
      <ol className="space-y-1.5">
        {item.replies.map((reply) => (
          <li
            key={reply.id}
            className="group/reply surface hairline relative rounded-xl rounded-tl-sm border px-3 py-2"
          >
            <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed">
              {reply.text}
            </p>
            <div className="mt-1 flex items-center gap-1">
              <time
                className="muted text-[11px] tabular-nums"
                dateTime={new Date(reply.createdAt).toISOString()}
                title={fullStamp(reply.createdAt)}
              >
                {stamp(reply.createdAt)}
              </time>
              <div className="ml-auto flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => onPromoteReply(reply.id)}
                  title="Turn this into a checklist item"
                  className="muted rounded-lg p-1.5 transition hover:bg-accent-500/10 hover:text-accent-700 dark:hover:text-accent-300"
                >
                  <PromoteIcon className="h-[15px] w-[15px]" />
                  <span className="sr-only">Turn into a checklist item</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveReply(reply.id)}
                  title="Delete this message"
                  className="muted rounded-lg p-1.5 transition hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                >
                  <TrashIcon className="h-[15px] w-[15px]" />
                  <span className="sr-only">Delete message</span>
                </button>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-1.5 flex items-end gap-2">
        <textarea
          ref={boxRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={item.replies.length ? 'Keep going…' : 'Elaborate on this idea…'}
          aria-label="Add to this thread"
          className="surface hairline min-h-[36px] flex-1 resize-none rounded-xl border px-3 py-2 text-[14px] leading-snug placeholder:text-ink-400 focus:border-accent-400 focus:outline-none dark:placeholder:text-ink-500"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!draft.trim()}
          aria-label="Add to thread"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-600 text-white transition enabled:hover:bg-accent-700 enabled:active:scale-95 disabled:opacity-25 dark:bg-accent-500"
        >
          <ArrowUpIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
