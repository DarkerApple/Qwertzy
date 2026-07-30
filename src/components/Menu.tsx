import { useEffect, useRef, useState } from 'react';
import { MenuIcon } from './icons';

interface Props {
  doneCount: number;
  onClearDone: () => void;
  /** False in the secret notebook, where a backup would be plaintext on disk. */
  allowBackup?: boolean;
  onExport: () => void;
  onImport: (file: File) => void;
}

/** Housekeeping tucked out of the way: clear done, export, import. */
export function Menu({ doneCount, onClearDone, allowBackup = true, onExport, onImport }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

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

  const itemClass =
    'block w-full rounded-lg px-3 py-2 text-left text-[13px] transition hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-ink-800';

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More options"
        className="surface hairline muted flex h-9 w-9 items-center justify-center rounded-full border transition hover:text-ink-900 dark:hover:text-ink-100"
      >
        <MenuIcon />
      </button>

      {open && (
        <div
          role="menu"
          className="animate-pop-in surface hairline absolute right-0 top-11 z-30 w-56 rounded-xl border p-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            disabled={doneCount === 0}
            onClick={() => {
              onClearDone();
              setOpen(false);
            }}
            className={itemClass}
          >
            Clear {doneCount} done {doneCount === 1 ? 'item' : 'items'}
          </button>
          {allowBackup && (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onExport();
                  setOpen(false);
                }}
                className={itemClass}
              >
                Export a backup (.json)
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => fileRef.current?.click()}
                className={itemClass}
              >
                Import a backup…
              </button>
            </>
          )}
          <p className="muted px-3 py-2 text-[11px] leading-relaxed">
            {allowBackup
              ? 'Everything stays in this browser. Nothing is uploaded anywhere.'
              : 'These notes are encrypted on disk, so there’s no plain-text backup to export.'}
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              // Reset so re-picking the same file fires change again.
              e.target.value = '';
              if (file) {
                onImport(file);
                setOpen(false);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
