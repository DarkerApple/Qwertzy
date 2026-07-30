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

/**
 * The brand lockup: the mark in a gradient tile with a lit top edge, beside
 * the name set in the display face. Bigger than a favicon-sized chip, because
 * it's the one thing on the page that says where you are.
 */
export function QuartzBadge({ className }: Props) {
  return (
    <span
      className={
        className ??
        'relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-accent-400 to-accent-700 text-white shadow-sm ring-1 ring-inset ring-white/20'
      }
    >
      {/* A sheen across the top, the way light sits on a polished face. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent"
      />
      <QuartzMark className="relative h-[21px] w-[21px]" />
    </span>
  );
}

/** The badge and the name together — the header's left-hand side. */
export function QuartzWordmark({ onClick }: { onClick?: () => void }) {
  const inner = (
    <>
      <QuartzBadge />
      <span className="font-display text-[21px] leading-none tracking-tight">Qwertzy</span>
    </>
  );
  if (!onClick) return <span className="flex items-center gap-2.5">{inner}</span>;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Qwertzy — all years"
      className="group flex items-center gap-2.5 rounded-xl transition active:scale-95"
    >
      {inner}
    </button>
  );
}

/**
 * A crystal that grows out of a corner when you point at what it's decorating.
 * Purely ornamental — always `aria-hidden`, always `pointer-events-none`, and
 * it starts at zero so it costs nothing visually until you're already there.
 */
export function QuartzCorner({
  corner = 'br',
  className = '',
}: {
  corner?: 'br' | 'tr' | 'bl' | 'tl';
  className?: string;
}) {
  const place = {
    br: '-bottom-3 -right-3 origin-bottom-right',
    tr: '-top-3 -right-3 origin-top-right',
    bl: '-bottom-3 -left-3 origin-bottom-left',
    tl: '-top-3 -left-3 origin-top-left',
  }[corner];

  return (
    <QuartzMark
      className={`pointer-events-none absolute ${place} h-12 w-12 scale-0 rotate-12 text-current opacity-0 transition-all duration-300 ease-out group-hover:scale-100 group-hover:rotate-0 group-hover:opacity-[0.13] group-focus-visible:scale-100 group-focus-visible:opacity-[0.13] ${className}`}
    />
  );
}

/**
 * A little cluster of crystals, for the empty spaces where a page would
 * otherwise just be a sentence in the middle of nothing.
 */
export function QuartzCluster({ className = '' }: Props) {
  return (
    <span aria-hidden="true" className={`relative inline-block ${className}`}>
      <QuartzMark className="absolute bottom-0 left-0 h-7 w-7 -rotate-[18deg] opacity-30" />
      <QuartzMark className="absolute bottom-0 right-0 h-9 w-9 rotate-[14deg] opacity-25" />
      <QuartzMark className="relative mx-auto block h-14 w-14 opacity-45" />
    </span>
  );
}
