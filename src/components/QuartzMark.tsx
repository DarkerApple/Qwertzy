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
      {/* A cut gem: a table across the top, two crown facets, two pavilion
          facets down to the point. The facets differ only in opacity, so the
          shape survives being 16px — it just becomes a clean silhouette. */}
      <path d="M9.6 5h4.8l4 5.1H5.6z" opacity="0.34" />
      <path d="M9.6 5 5.6 10.1H12V5z" opacity="0.95" />
      <path d="M14.4 5l4 5.1H12V5z" opacity="0.62" />
      <path d="M5.6 10.1H12V20.6z" opacity="0.88" />
      <path d="M18.4 10.1H12V20.6z" opacity="0.5" />
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
