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
      {/* Left face, right face and the tip, as three shapes with the facet
          edges left as gaps — the tile colour shows through as the cut. */}
      <path d="M11.2 2.6L5.6 8.9l4.9 1.7z" />
      <path d="M12.8 2.6l5.6 6.3-4.9 1.7z" />
      <path d="M5.4 10.2l4.8 1.7 0.6 9.5-3.9-1.6z" />
      <path d="M18.6 10.2l-4.8 1.7-0.6 9.5 3.9-1.6z" />
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
