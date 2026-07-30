interface Props {
  className?: string;
}

/**
 * Quartz — the app's mark. A crystal: a pointed termination over a prism.
 *
 * The body is solid and the facets are cut out of it rather than drawn on top,
 * so the shape survives being 16px in a browser tab. An outlined version with
 * interior lines turned to mush at that size.
 */
export function QuartzMark({ className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className ?? 'h-4 w-4'}
      aria-hidden="true"
    >
      {/* Two facets meeting at a central ridge. Kept to two shapes so the
          crystal still reads at 16px in a browser tab — an outlined version,
          or one cut into four, turns to mush at that size. */}
      <path d="M11.55 2.4 5.6 8.9 7.2 20.4 11.55 21.6z" />
      <path d="M12.45 2.4 18.4 8.9 16.8 20.4 12.45 21.6z" />
    </svg>
  );
}

/** The mark in its tile, as it appears in the header. */
export function QuartzBadge({ className }: Props) {
  return (
    <span
      className={
        className ??
        'flex h-7 w-7 items-center justify-center rounded-lg bg-accent-600 text-white dark:bg-accent-500'
      }
    >
      <QuartzMark />
    </span>
  );
}
