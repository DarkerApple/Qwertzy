interface Props {
  text: string;
  onUndo: () => void;
  onDismiss: () => void;
}

/** Deleting is one tap, so it always comes with a way back. */
export function UndoToast({ text, onUndo, onDismiss }: Props) {
  return (
    <div
      role="status"
      className="animate-toast-in surface hairline pointer-events-auto flex max-w-[calc(100vw-1.5rem)] items-center gap-3 rounded-2xl border py-2 pl-4 pr-2 shadow-lift"
    >
      <span className="truncate text-[13px]">
        Deleted <span className="muted">“{text}”</span>
      </span>
      <button
        type="button"
        onClick={onUndo}
        className="shrink-0 rounded-full bg-accent-600 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-accent-700 dark:bg-accent-500"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="muted shrink-0 px-1.5 text-[13px] transition hover:text-[rgb(var(--text))]"
      >
        ✕
      </button>
    </div>
  );
}
