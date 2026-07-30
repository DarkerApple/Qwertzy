import type { NoteTimer } from '../types';
import { describeDuration, formatClock, remainingMs } from '../lib/timer';

interface Props {
  timer: NoteTimer;
  now: number;
  onToggle: () => void;
  onReset: () => void;
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3" aria-hidden="true">
      <path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3 w-3"
      aria-hidden="true"
    >
      <path d="M4 5v5h5" />
      <path d="M4.5 14a7.5 7.5 0 103-8.2L4 10" />
    </svg>
  );
}

/**
 * A `time(...)` token, rendered where it was written. The chip fills up as the
 * countdown drains, so a glance down the page tells you how far along you are
 * without reading any numbers.
 */
export function TimerChip({ timer, now, onToggle, onReset }: Props) {
  const left = remainingMs(timer, now);
  const done = timer.state === 'done' || left === 0;
  const elapsed = 1 - left / (timer.seconds * 1000);
  const pct = Math.min(100, Math.max(0, elapsed * 100));

  const tone = done
    ? 'border-amber-400/70 text-amber-700 dark:border-amber-400/40 dark:text-amber-300'
    : timer.state === 'running'
      ? 'border-accent-300 text-accent-800 dark:border-accent-700 dark:text-accent-200'
      : 'hairline muted';

  const title = timer.label
    ? `${timer.label} — ${describeDuration(timer.seconds)}`
    : describeDuration(timer.seconds);

  return (
    <span
      className={`relative mx-0.5 inline-flex select-none items-center gap-1.5 overflow-hidden rounded-full border py-0.5 pl-1.5 pr-1 align-baseline text-[12px] leading-5 ${tone}`}
      title={title}
    >
      {/* Progress sits behind the controls rather than beside them. */}
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 -z-0 transition-[width] duration-500 ease-linear ${
          done ? 'bg-amber-400/25' : 'bg-accent-500/15'
        }`}
        style={{ width: `${done ? 100 : pct}%` }}
      />
      <button
        type="button"
        // The row beneath opens a thread when clicked; the chip is its own thing.
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-label={
          done
            ? `Restart ${describeDuration(timer.seconds)} timer`
            : timer.state === 'running'
              ? `Pause ${describeDuration(timer.seconds)} timer`
              : `Start ${describeDuration(timer.seconds)} timer`
        }
        className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full transition hover:bg-black/5 dark:hover:bg-white/10"
      >
        {done ? <ResetIcon /> : timer.state === 'running' ? <PauseIcon /> : <PlayIcon />}
      </button>

      <span className="relative z-10 font-medium tabular-nums">
        {done ? "time's up" : formatClock(left)}
      </span>

      {timer.label && (
        <span className="relative z-10 max-w-[10rem] truncate opacity-70">{timer.label}</span>
      )}

      {!done && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onReset();
          }}
          aria-label={`Reset ${describeDuration(timer.seconds)} timer`}
          className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full transition hover:bg-black/5 dark:hover:bg-white/10"
        >
          <ResetIcon />
        </button>
      )}
    </span>
  );
}
