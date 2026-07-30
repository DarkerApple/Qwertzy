import { useMemo, useState } from 'react';
import type { Item } from '../types';
import { inMonth, inWrittenOrder } from '../lib/group';
import { monthLabel, timeLabel } from '../lib/time';
import { withoutTimerTokens } from '../lib/timer';
import { QuartzBadge } from './QuartzMark';
import { ChevronLeftIcon } from './icons';
import { Plot } from './Plot';

interface Props {
  items: Item[];
  month: string;
  onBack: () => void;
  onOpenMonth: (key: string) => void;
  chrome: React.ReactNode;
}

const EXAMPLES = ['x^2', 'sin(x)', '1/x', 'x^3-3x', 'sqrt(abs(x))', '2^x'];

/**
 * Two ways of seeing what's written: the month as a tree — notes down the
 * spine, threads and split-out notes branching off — and a plotter for
 * sketching a function while you think.
 */
export function Visualize({ items, month, onBack, onOpenMonth, chrome }: Props) {
  const [expression, setExpression] = useState('x^2');
  const [range, setRange] = useState<[number, number]>([-10, 10]);

  const monthItems = useMemo(() => inWrittenOrder(inMonth(items, month)), [items, month]);
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  // A note split out of a thread hangs off its parent rather than the spine.
  const children = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const item of monthItems) {
      if (!item.parentId) continue;
      map.set(item.parentId, [...(map.get(item.parentId) ?? []), item]);
    }
    return map;
  }, [monthItems]);

  const roots = monthItems.filter((item) => !item.parentId || !byId.has(item.parentId));

  return (
    <div className="page">
      <header
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{ height: 'var(--header-h)', backgroundColor: 'rgb(var(--paper) / 0.82)' }}
      >
        <div className="mx-auto flex h-full max-w-2xl items-center gap-1 px-4 sm:px-5 lg:max-w-6xl">
          <button
            type="button"
            onClick={onBack}
            className="muted flex h-9 items-center gap-1 rounded-xl pl-1 pr-2 transition hover:text-[rgb(var(--text))]"
          >
            <ChevronLeftIcon className="h-[18px] w-[18px]" />
            <span className="text-[13px] font-medium">Back</span>
          </button>
          <QuartzBadge className="ml-1 flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-accent-400 to-accent-700 text-white ring-1 ring-inset ring-white/20" />
          <div className="ml-auto flex items-center gap-0.5">{chrome}</div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-3 sm:px-5 lg:max-w-6xl">
        <h1 className="font-display text-[34px] leading-[1.05] tracking-tight sm:text-[42px]">
          Visualise
        </h1>
        <p className="muted mt-2 text-[13px]">
          {monthLabel(month)} as a tree, and a plotter for thinking a function through.
        </p>

        <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-5">
          {/* ---------------------------------------------------------- tree */}
          <section className="surface hairline rounded-3xl border p-5 shadow-sheet">
            <h2 className="text-[14px] font-medium">The month as a tree</h2>
            <p className="muted mt-1 text-[12px] leading-relaxed">
              Each note is a branch; its thread hangs beneath it, and anything you split out of a
              thread hangs off the note it came from.
            </p>

            {roots.length === 0 ? (
              <p className="muted mt-5 text-[13px]">
                Nothing written this month yet.{' '}
                <button
                  type="button"
                  onClick={() => onOpenMonth(month)}
                  className="text-accent-700 underline decoration-dotted underline-offset-2 dark:text-accent-300"
                >
                  Open the page
                </button>
                .
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {roots.map((item) => (
                  <Branch key={item.id} item={item} children={children.get(item.id) ?? []} />
                ))}
              </ul>
            )}
          </section>

          {/* -------------------------------------------------------- plotter */}
          <section className="surface hairline mt-4 rounded-3xl border p-5 shadow-sheet lg:mt-0">
            <h2 className="text-[14px] font-medium">Plot a function</h2>
            <p className="muted mt-1 text-[12px] leading-relaxed">
              Sketch a curve while you're working something out. Write{' '}
              <code className="hairline surface rounded border px-1 py-0.5 text-[11px]">
                graph(x^2)
              </code>{' '}
              in a note to keep one there.
            </p>

            <label className="sr-only" htmlFor="expression">
              Expression
            </label>
            <input
              id="expression"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              spellCheck={false}
              placeholder="x^2"
              className="surface hairline mt-3 w-full rounded-xl border px-3 py-2 font-mono text-[14px] focus:border-accent-400 focus:outline-none"
            />

            <div className="mt-2 flex flex-wrap gap-1.5">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setExpression(example)}
                  className={`hairline rounded-full border px-2.5 py-1 font-mono text-[11px] transition hover:border-accent-300 ${
                    expression === example ? 'border-accent-400 bg-accent-500/10' : ''
                  }`}
                >
                  {example}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <Plot expression={expression} from={range[0]} to={range[1]} height={220} />
            </div>

            <div className="muted mt-2 flex items-center gap-2 text-[12px]">
              <span>x from</span>
              <NumberBox value={range[0]} onChange={(v) => setRange([v, range[1]])} />
              <span>to</span>
              <NumberBox value={range[1]} onChange={(v) => setRange([range[0], v])} />
            </div>

            <p className="muted mt-3 text-[11px] leading-relaxed">
              Understands + − × ÷ % ^, brackets, and sin cos tan asin acos atan sqrt cbrt abs ln log
              exp floor ceil round sign min max pow mod, with pi, e and tau. <code>2x</code> and{' '}
              <code>3(x+1)</code> mean what they look like.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

function Branch({ item, children }: { item: Item; children: Item[] }) {
  return (
    <li>
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
            item.done ? 'bg-accent-600 dark:bg-accent-500' : 'hairline border-2'
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className={`text-[14px] leading-snug ${item.done ? 'muted line-through' : ''}`}>
            {withoutTimerTokens(item.text)}
          </p>
          <p className="muted mt-0.5 text-[11px] tabular-nums">{timeLabel(item.createdAt)}</p>
        </div>
      </div>

      {(item.replies.length > 0 || children.length > 0) && (
        <ul
          className="ml-[5px] mt-2 space-y-2 border-l pl-4"
          style={{ borderColor: 'rgb(var(--line))' }}
        >
          {item.replies.map((reply) => (
            <li key={reply.id} className="muted text-[12px] leading-relaxed">
              {reply.text}
            </li>
          ))}
          {children.map((child) => (
            <li key={child.id}>
              <div className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    child.done ? 'bg-accent-600 dark:bg-accent-500' : 'hairline border-2'
                  }`}
                />
                <p
                  className={`text-[13px] leading-snug ${child.done ? 'muted line-through' : ''}`}
                >
                  {withoutTimerTokens(child.text)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function NumberBox({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => {
        const next = Number(e.target.value);
        if (Number.isFinite(next)) onChange(next);
      }}
      className="surface hairline w-16 rounded-lg border px-2 py-1 text-[12px] tabular-nums focus:border-accent-400 focus:outline-none"
    />
  );
}
