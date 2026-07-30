import type { ReactNode } from 'react';
import { ChevronLeftIcon } from './icons';

interface Props {
  onBack: () => void;
  onStart: () => void;
  themeToggle: ReactNode;
}

/** How the app works, written as the page it describes. */
export function Guide({ onBack, onStart, themeToggle }: Props) {
  return (
    <div className="page">
      <header
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{ height: 'var(--header-h)', backgroundColor: 'rgb(var(--paper) / 0.82)' }}
      >
        <div className="mx-auto flex h-full max-w-2xl items-center gap-1 px-4 sm:px-5">
          <button
            type="button"
            onClick={onBack}
            className="muted flex h-9 items-center gap-1 rounded-xl pl-1 pr-2 transition hover:text-[rgb(var(--text))]"
          >
            <ChevronLeftIcon className="h-[18px] w-[18px]" />
            <span className="text-[13px] font-medium">Back</span>
          </button>
          <div className="ml-auto">{themeToggle}</div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-3 sm:px-5">
        <h1 className="font-display text-[34px] leading-[1.05] tracking-tight sm:text-[42px]">
          How Qwertzy works
        </h1>
        <p className="muted mt-1.5 text-[13px] leading-relaxed">
          Four things to know. It takes about a minute.
        </p>

        <Step
          n={1}
          title="Just write"
          body="The last line of the page is a live caret — no button to press first. Press Enter to break the line, so one thought can run as long as it needs. Press Enter twice to finish that thought and start the next. Look away and it saves itself."
        >
          <Sample>
            <SampleLine>Pitch for the newsletter:</SampleLine>
            <SampleLine>open with the clock repair guy</SampleLine>
            <SampleLine muted>Enter, Enter — that note is done, the next one starts</SampleLine>
          </Sample>
        </Step>

        <Step
          n={2}
          title="Every note is a checkbox"
          body="That's the automatic part — there's no note-or-task decision to make. Tick it when it's done. Paste a bulleted list and each line becomes its own item, markers stripped."
        >
          <Sample>
            <SampleLine check>Ask Dana about the offsite</SampleLine>
            <SampleLine check done>Call the dentist back</SampleLine>
          </Sample>
        </Step>

        <Step
          n={3}
          title="Write a timer into the sentence"
          body="Put time(10m) in a note and it becomes a live clock right where you typed it, counting down from the moment you finish the note. When it's up you get a notification, a chime and a banner."
        >
          <Sample>
            <SampleLine>
              Steep the tea{' '}
              <span className="mx-0.5 inline-flex items-center gap-1.5 rounded-full border border-accent-300 px-2 py-0.5 align-baseline text-[12px] text-accent-800 dark:border-accent-700 dark:text-accent-200">
                <span aria-hidden="true">▶</span>
                <span className="tabular-nums">3:00</span>
                <span className="opacity-70">green tea</span>
              </span>{' '}
              then take it off the heat
            </SampleLine>
          </Sample>
          <dl className="mt-3 grid gap-x-4 gap-y-1 text-[12px] sm:grid-cols-2">
            <Form code="time(90)">90 seconds — a bare number is seconds</Form>
            <Form code="time(10m)">units: s, m, h</Form>
            <Form code="time(1h30m)">combined</Form>
            <Form code="time(2:30)">mm:ss, or h:mm:ss</Form>
            <Form code="time(10m, steep)">a label for the notification</Form>
            <Form code="time(soon)">not a duration — stays as text</Form>
          </dl>
        </Step>

        <Step
          n={4}
          title="Tap a note to think it through"
          body="Every note opens a thread. Keep adding to it as the idea develops, and when the thinking produces an actual next step, one tap promotes that message into its own checkbox. Edit and Delete live in there too."
        />

        <div className="hairline mt-8 rounded-2xl border border-dashed p-4">
          <h2 className="text-[14px] font-medium">Getting around</h2>
          <ul className="muted mt-2 space-y-1.5 text-[13px] leading-relaxed">
            <li>
              A month is <strong className="font-medium">one page</strong>. Tabs at the top switch
              months; on a phone you can swipe the page sideways.
            </li>
            <li>Every line shows its time in the margin, and the date only if it wasn't today.</li>
            <li>Search covers every month, and looks inside threads too.</li>
            <li>
              <strong className="font-medium">Secret notes</strong> is a second notebook behind a
              password — same page, same timers, encrypted on disk.
            </li>
          </ul>
        </div>

        <div className="hairline mt-3 rounded-2xl border p-4">
          <h2 className="text-[14px] font-medium">Keyboard</h2>
          <dl className="mt-2 grid gap-x-4 gap-y-1.5 text-[13px] sm:grid-cols-2">
            <Shortcut keys="N">jump to the writing line</Shortcut>
            <Shortcut keys="/">search</Shortcut>
            <Shortcut keys="← →">previous / next month</Shortcut>
            <Shortcut keys="Enter Enter">finish a note</Shortcut>
            <Shortcut keys="⌘ / Ctrl + Enter">finish a note now</Shortcut>
            <Shortcut keys="Esc">close a thread or search</Shortcut>
          </dl>
        </div>

        <p className="muted mt-6 text-[12px] leading-relaxed">
          Everything lives in this browser — no account, nothing uploaded. Clearing site data clears
          your notes, so the ⋮ menu can export a backup file.
        </p>

        <button
          type="button"
          onClick={onStart}
          className="mt-6 w-full rounded-2xl bg-accent-600 px-4 py-3 text-[14px] font-semibold text-white transition hover:bg-accent-700 dark:bg-accent-500 dark:hover:bg-accent-400"
        >
          Start writing
        </button>
      </main>
    </div>
  );
}

function Step({
  n,
  title,
  body,
  children,
}: {
  n: number;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <section className="mt-7">
      <div className="flex items-baseline gap-2.5">
        <span className="font-display text-accent-600 text-[15px] tabular-nums dark:text-accent-400">
          {n}
        </span>
        <h2 className="text-[17px] font-medium tracking-tight">{title}</h2>
      </div>
      <p className="muted mt-1 pl-[26px] text-[13px] leading-relaxed">{body}</p>
      {children && <div className="mt-3 pl-[26px]">{children}</div>}
    </section>
  );
}

function Sample({ children }: { children: ReactNode }) {
  return (
    <div className="surface hairline rounded-xl border p-3 shadow-sm">
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function SampleLine({
  children,
  check,
  done,
  muted,
}: {
  children: ReactNode;
  check?: boolean;
  done?: boolean;
  muted?: boolean;
}) {
  return (
    <p className={`flex items-start gap-2.5 text-[14px] leading-snug ${muted ? 'muted text-[12px]' : ''}`}>
      {check && (
        <span
          aria-hidden="true"
          className={`mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border-[1.5px] text-[11px] ${
            done
              ? 'border-accent-600 bg-accent-600 text-white dark:border-accent-500 dark:bg-accent-500'
              : 'hairline'
          }`}
        >
          {done ? '✓' : ''}
        </span>
      )}
      <span className={done ? 'muted line-through' : ''}>{children}</span>
    </p>
  );
}

function Form({ code, children }: { code: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt>
        <code className="hairline surface rounded border px-1.5 py-0.5 text-[11px]">{code}</code>
      </dt>
      <dd className="muted">{children}</dd>
    </div>
  );
}

function Shortcut({ keys, children }: { keys: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt>
        <kbd className="hairline surface rounded border px-1.5 py-0.5 font-sans text-[11px] font-medium">
          {keys}
        </kbd>
      </dt>
      <dd className="muted">{children}</dd>
    </div>
  );
}
