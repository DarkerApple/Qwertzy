import { useMemo } from 'react';
import { compile, ExpressionError, sample } from '../lib/expr';

interface Props {
  expression: string;
  from?: number;
  to?: number;
  height?: number;
  /** Compact styling for a plot sitting inside a line of a note. */
  inline?: boolean;
}

/**
 * A function of x, drawn. The y range comes from the samples rather than being
 * fixed, so a curve fills the box whatever its scale, and undefined stretches
 * break the line instead of drawing a spike through an asymptote.
 */
export function Plot({ expression, from = -10, to = 10, height = 160, inline = false }: Props) {
  const result = useMemo(() => {
    try {
      const fn = compile(expression);
      const points = sample(fn, from, to, inline ? 120 : 320);
      const finite = points.filter((p) => Number.isFinite(p.y)).map((p) => p.y);
      if (finite.length === 0) return { error: 'Nothing to draw in this range.' };

      let low = Math.min(...finite);
      let high = Math.max(...finite);
      // A flat line still needs a box to sit in.
      if (high - low < 1e-9) {
        low -= 1;
        high += 1;
      }
      // Clamp a runaway range so one huge value doesn't flatten everything else.
      const span = high - low;
      const pad = span * 0.08;
      return { points, low: low - pad, high: high + pad };
    } catch (error) {
      return {
        error: error instanceof ExpressionError ? error.message : 'That expression didn’t work.',
      };
    }
  }, [expression, from, to, inline]);

  if ('error' in result && result.error) {
    return (
      <span
        className={`hairline muted inline-flex items-center rounded-lg border border-dashed px-2 py-1 text-[11px] ${
          inline ? 'align-middle' : ''
        }`}
      >
        graph({expression}) — {result.error}
      </span>
    );
  }

  const { points = [], low = 0, high = 1 } = result as { points: { x: number; y: number }[]; low: number; high: number };
  const width = inline ? 150 : 640;
  const h = inline ? 46 : height;
  const toX = (x: number) => ((x - from) / (to - from)) * width;
  const toY = (y: number) => h - ((y - low) / (high - low)) * h;

  // Break the path wherever the function isn't defined.
  let d = '';
  let penDown = false;
  for (const point of points) {
    if (Number.isNaN(point.y)) {
      penDown = false;
      continue;
    }
    const y = toY(point.y);
    // Values far outside the box would draw a near-vertical wall; lift the pen.
    if (y < -h * 2 || y > h * 3) {
      penDown = false;
      continue;
    }
    d += `${penDown ? 'L' : 'M'}${toX(point.x).toFixed(2)} ${y.toFixed(2)}`;
    penDown = true;
  }

  const zeroY = low <= 0 && high >= 0 ? toY(0) : null;
  const zeroX = from <= 0 && to >= 0 ? toX(0) : null;

  return (
    <span
      className={
        inline
          ? 'hairline surface mx-0.5 inline-block max-w-full overflow-hidden rounded-lg border align-middle'
          : 'hairline surface block overflow-hidden rounded-xl border'
      }
    >
      <svg
        viewBox={`0 0 ${width} ${h}`}
        width={inline ? width : undefined}
        height={inline ? h : undefined}
        className={inline ? 'block' : 'block h-auto w-full'}
        role="img"
        aria-label={`Graph of ${expression} from x=${from} to x=${to}`}
        preserveAspectRatio="none"
      >
        {zeroY !== null && (
          <line x1="0" y1={zeroY} x2={width} y2={zeroY} stroke="rgb(var(--line))" strokeWidth="1" />
        )}
        {zeroX !== null && (
          <line x1={zeroX} y1="0" x2={zeroX} y2={h} stroke="rgb(var(--line))" strokeWidth="1" />
        )}
        <path
          d={d}
          fill="none"
          stroke="rgb(var(--accent-500))"
          strokeWidth={inline ? 1.6 : 2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </span>
  );
}
