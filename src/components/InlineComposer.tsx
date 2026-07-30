import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { countNotes } from '../lib/parse';
import { timeLabel } from '../lib/time';
import { describeDuration, findTimerTokens } from '../lib/timer';

interface Props {
  onCapture: (text: string) => void;
  placeholder?: string;
}

/**
 * Where you write, and it's just the next line of the page — same gutter, same
 * type, same grey time in the margin as every note above it. No box, no send
 * button.
 *
 * Enter breaks the line, so one note can be as long as it wants. Enter on an
 * empty line — the second Enter in a row — finishes that note and starts the
 * next, which is how you'd separate two thoughts on paper anyway.
 */
export const InlineComposer = forwardRef<HTMLTextAreaElement, Props>(function InlineComposer(
  { onCapture, placeholder = 'Write…' },
  ref,
) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const innerRef = useRef<HTMLTextAreaElement | null>(null);
  // Escape commits and then blurs, and blur commits too. Both run before React
  // re-renders, so the draft is tracked in a ref that clears synchronously —
  // otherwise the second call would file the same note twice.
  const draft = useRef('');

  function update(value: string) {
    draft.current = value;
    setText(value);
  }

  const attach = (node: HTMLTextAreaElement | null) => {
    innerRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  // Grow with the writing — the page gets longer, nothing scrolls inside a box.
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  // The margin time is the stamp this note is about to get; keep it honest
  // while you write, but only while there's something to stamp.
  useEffect(() => {
    if (!text) return;
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [text]);

  function commit() {
    const value = draft.current;
    update('');
    if (!value.trim()) return;
    onCapture(value);
    setNow(Date.now());
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;

    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      commit();
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      const before = el.value.slice(0, el.selectionStart);
      const currentLine = before.slice(before.lastIndexOf('\n') + 1);
      // Enter on a line that's already empty: end this note, start the next.
      if (currentLine.trim() === '') {
        e.preventDefault();
        commit();
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      commit();
      el.blur();
    }
  }

  const pending = countNotes(text);
  const timers = findTimerTokens(text);

  // The hint answers whatever you're currently doing: writing a timer, writing
  // several notes at once, or just writing.
  const hint =
    timers.length > 0
      ? `${timers.length === 1 ? 'Starts a' : `Starts ${timers.length} timers —`} ${timers
          .map((t) => describeDuration(t.seconds))
          .join(', ')} timer when you finish this note`
      : pending > 1
        ? `${pending} notes — a blank line ends each one`
        : 'Enter for a new line · Enter twice starts the next note · time(10m) starts a timer';

  return (
    <div className="pb-2">
      <div
        className="flex items-start gap-3 px-3 py-2.5 sm:px-4"
        onClick={() => innerRef.current?.focus()}
      >
        <span
          aria-hidden="true"
          className={`hairline mt-px h-[22px] w-[22px] shrink-0 rounded-[7px] border-[1.5px] border-dashed transition-opacity ${
            text || focused ? 'opacity-100' : 'opacity-50'
          }`}
        />
        <textarea
          ref={attach}
          value={text}
          onChange={(e) => update(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={(e) => {
            setFocused(true);
            // Keep the line above a phone keyboard as it rises.
            setTimeout(() => e.target.scrollIntoView({ block: 'nearest' }), 120);
          }}
          onBlur={() => {
            setFocused(false);
            // Leaving the page shouldn't lose what you wrote.
            commit();
          }}
          rows={1}
          placeholder={placeholder}
          aria-label="Write a note"
          className="no-ring min-h-[22px] flex-1 resize-none overflow-hidden border-0 bg-transparent p-0 leading-snug placeholder:text-ink-400 focus:outline-none dark:placeholder:text-ink-500"
        />
        {/* Matches the row gutter exactly, including the space a row keeps for
            its pointer-only delete, so every stamp lines up. */}
        <div className="flex shrink-0 items-start gap-1 pt-px">
          <span className="muted w-14 text-right text-[11px] tabular-nums">
            {text ? timeLabel(now) : ''}
          </span>
          <span aria-hidden="true" className="-mr-1 hidden w-[27px] sm:block" />
        </div>
      </div>

      {(focused || text) && (
        <p
          className={`animate-fade-in px-3 pl-[52px] text-[11px] sm:px-4 sm:pl-[56px] ${
            timers.length > 0 ? 'text-accent-700 dark:text-accent-300' : 'muted'
          }`}
        >
          {hint}
        </p>
      )}

      {/* Tapping the empty page below the last line puts you back in it. */}
      <div
        aria-hidden="true"
        className="h-10 cursor-text"
        onClick={() => innerRef.current?.focus()}
      />
    </div>
  );
});
