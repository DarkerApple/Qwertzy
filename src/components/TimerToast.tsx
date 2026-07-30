interface Props {
  text: string;
  label: string | null;
  onDismiss: () => void;
}

/**
 * The in-app half of "your timer finished". A system notification may be
 * blocked, muted or on another desktop; this one is where you're already
 * looking.
 */
export function TimerToast({ text, label, onDismiss }: Props) {
  return (
    <div
      role="alert"
      className="animate-slide-up surface pointer-events-auto flex max-w-[calc(100vw-1.5rem)] items-center gap-3 rounded-2xl border border-amber-400/60 py-2 pl-4 pr-2 shadow-lift"
    >
      <span className="text-[15px]" aria-hidden="true">
        ⏱
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-medium">{label ? `${label} — time's up` : "Time's up"}</p>
        <p className="muted truncate text-[12px]">{text}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-auto shrink-0 rounded-full bg-accent-600 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-accent-700 dark:bg-accent-500"
      >
        Got it
      </button>
    </div>
  );
}
