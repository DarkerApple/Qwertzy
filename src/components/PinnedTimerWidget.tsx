import { useEffect, useRef, useState } from 'react';
import type { PinnedTimer } from '../hooks/usePinnedTimer';
import { PRESETS } from '../hooks/usePinnedTimer';
import { formatClock } from '../lib/timer';
import { CloseIcon, StopwatchIcon } from './icons';

interface Props {
  timer: PinnedTimer | null;
  remaining: number;
  onStart: (seconds: number, label?: string) => void;
  onToggle: () => void;
  onReset: () => void;
  onClear: () => void;
}

/**
 * The pinned timer, in the header of every page. Unlike a timer written into a
 * note, this one isn't attached to anything — it's for whatever you're doing
 * now, and it survives moving around the app and reloading.
 */
export function PinnedTimerWidget({ timer, remaining, onStart, onToggle, onReset, onClear }: Props) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const done = timer?.state === 'done';

  return (
    <div ref={wrapRef} className="relative">
      {timer ? (
        <div
          className={`hairline flex items-center gap-1 rounded-full border py-0.5 pl-0.5 pr-1 transition-colors ${
            done
              ? 'animate-ring-pulse border-amber-400/70 text-amber-700 dark:text-amber-300'
              : timer.state === 'running'
                ? 'border-accent-300 dark:border-accent-700'
                : ''
          }`}
        >
          <button
            type="button"
            onClick={onToggle}
            aria-label={
              done ? 'Restart pinned timer' : timer.state === 'running' ? 'Pause pinned timer' : 'Start pinned timer'
            }
            className="flex h-7 items-center gap-1.5 rounded-full px-2 text-[13px] font-medium tabular-nums transition hover:bg-black/5 dark:hover:bg-white/10"
          >
            <StopwatchIcon className="h-3.5 w-3.5" />
            {done ? "time's up" : formatClock(remaining)}
          </button>
          <button
            type="button"
            onClick={onReset}
            aria-label="Reset pinned timer"
            title="Reset"
            className="muted flex h-6 w-6 items-center justify-center rounded-full text-[13px] transition hover:bg-black/5 dark:hover:bg-white/10"
          >
            ↺
          </button>
          <button
            type="button"
            onClick={onClear}
            aria-label="Remove pinned timer"
            className="muted flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-black/5 dark:hover:bg-white/10"
          >
            <CloseIcon className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Pin a timer"
          title="Pin a timer"
          aria-expanded={open}
          className="muted flex h-9 w-9 items-center justify-center rounded-xl transition duration-200 hover:text-[rgb(var(--text))]"
        >
          <StopwatchIcon />
        </button>
      )}

      {open && !timer && (
        <div className="animate-pop-in surface hairline absolute right-0 top-11 z-40 w-56 rounded-2xl border p-2 shadow-lg">
          <p className="muted px-2 pb-1.5 pt-1 text-[11px] font-medium uppercase tracking-wider">
            Pin a timer
          </p>
          <div className="grid grid-cols-2 gap-1">
            {PRESETS.map((preset) => (
              <button
                key={preset.seconds}
                type="button"
                onClick={() => {
                  onStart(preset.seconds);
                  setOpen(false);
                }}
                className="hairline rounded-lg border px-2 py-1.5 text-[13px] transition hover:border-accent-300"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const minutes = Number(custom);
              if (!Number.isFinite(minutes) || minutes <= 0) return;
              onStart(Math.round(minutes * 60));
              setCustom('');
              setOpen(false);
            }}
            className="mt-2 flex gap-1"
          >
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              inputMode="decimal"
              placeholder="Minutes"
              aria-label="Minutes"
              className="surface hairline min-w-0 flex-1 rounded-lg border px-2 py-1.5 text-[13px] focus:border-accent-400 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-accent-600 px-2.5 text-[13px] font-medium text-white transition hover:bg-accent-700 dark:bg-accent-500"
            >
              Go
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
