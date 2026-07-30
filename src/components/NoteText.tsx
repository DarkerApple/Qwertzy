import { Fragment } from 'react';
import type { Item } from '../types';
import { findGraphTokens, findTimerTokens } from '../lib/timer';
import { TimerChip } from './TimerChip';
import { Plot } from './Plot';

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
  const timerTokens = findTimerTokens(item.text);
  const graphTokens = findGraphTokens(item.text);
  if (timerTokens.length === 0 && graphTokens.length === 0) {
    return <span className={className}>{item.text}</span>;
  }

  // Both kinds of token live in one stream, ordered by where they appear.
  const marks = [
    ...timerTokens.map((token, i) => ({ ...token, kind: 'timer' as const, index: i })),
    ...graphTokens.map((token) => ({ ...token, kind: 'graph' as const, index: -1 })),
  ].sort((a, b) => a.start - b.start);

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  marks.forEach((mark) => {
    if (mark.start > cursor) parts.push(item.text.slice(cursor, mark.start));
    if (mark.kind === 'graph') {
      parts.push(
        <Plot key={`g${mark.start}`} expression={mark.expression} from={mark.from} to={mark.to} inline />,
      );
    } else {
      const timer = item.timers[mark.index];
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
          mark.raw
        ),
      );
    }
    cursor = mark.end;
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
