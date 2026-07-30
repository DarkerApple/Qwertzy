import { Fragment } from 'react';
import type { Item } from '../types';
import { findTimerTokens } from '../lib/timer';
import { TimerChip } from './TimerChip';

interface Props {
  item: Item;
  now: number;
  onToggleTimer: (timerId: string) => void;
  onResetTimer: (timerId: string) => void;
  className?: string;
}

/**
 * A note's text, with each `time(...)` token swapped for its live clock. The
 * text either side is untouched, so the note still reads as the sentence it was
 * written as.
 */
export function NoteText({ item, now, onToggleTimer, onResetTimer, className }: Props) {
  const tokens = findTimerTokens(item.text);
  if (tokens.length === 0 || item.timers.length === 0) {
    return <span className={className}>{item.text}</span>;
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  tokens.forEach((token, i) => {
    const timer = item.timers[i];
    if (token.start > cursor) parts.push(item.text.slice(cursor, token.start));
    // A token with no matching timer (mid-edit, say) stays as plain text.
    parts.push(
      timer ? (
        <TimerChip
          key={timer.id}
          timer={timer}
          now={now}
          onToggle={() => onToggleTimer(timer.id)}
          onReset={() => onResetTimer(timer.id)}
        />
      ) : (
        token.raw
      ),
    );
    cursor = token.end;
  });
  if (cursor < item.text.length) parts.push(item.text.slice(cursor));

  return (
    <span className={className}>
      {parts.map((part, i) => (
        <Fragment key={i}>{part}</Fragment>
      ))}
    </span>
  );
}
