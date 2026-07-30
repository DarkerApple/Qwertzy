import type { Settings as SettingsValues } from '../lib/settings';
import { ACCENTS } from '../lib/settings';
import { QuartzBadge, QuartzCorner } from './QuartzMark';
import { AlarmIcon, ChevronLeftIcon, ChevronRightIcon, PuzzleIcon } from './icons';

interface Props {
  settings: SettingsValues;
  onChange: <K extends keyof SettingsValues>(key: K, value: SettingsValues[K]) => void;
  pluginCount: number;
  alarmCount: number;
  onOpenPlugins: () => void;
  onOpenAlarms: () => void;
  onBack: () => void;
  chrome: React.ReactNode;
}

export function Settings({
  settings,
  onChange,
  pluginCount,
  alarmCount,
  onOpenPlugins,
  onOpenAlarms,
  onBack,
  chrome,
}: Props) {
  return (
    <div className="page">
      <header
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{ height: 'var(--header-h)', backgroundColor: 'rgb(var(--paper) / 0.82)' }}
      >
        <div className="mx-auto flex h-full max-w-2xl items-center gap-1 px-4 sm:px-5 lg:max-w-4xl">
          <button
            type="button"
            onClick={onBack}
            className="muted flex h-9 items-center gap-1 rounded-xl pl-1 pr-2 transition hover:text-[rgb(var(--text))]"
          >
            <ChevronLeftIcon className="h-[18px] w-[18px]" />
            <span className="text-[13px] font-medium">Back</span>
          </button>
          <QuartzBadge className="ml-1 flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-accent-400 to-accent-700 text-white ring-1 ring-inset ring-white/20" />
          <div className="ml-auto">{chrome}</div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-3 sm:px-5 lg:max-w-4xl">
        <h1 className="font-display text-[34px] leading-[1.05] tracking-tight sm:text-[42px]">
          Settings
        </h1>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-10">
        <Group title="Theme" hint="System follows whatever your device is set to.">
          <Segmented
            value={settings.theme}
            onChange={(v) => onChange('theme', v)}
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        </Group>

        <Group title="Accent" hint="Used for checkboxes, timers, progress and links.">
          <div className="flex flex-wrap gap-2">
            {ACCENTS.map((accent) => {
              const active = settings.accent === accent.name;
              return (
                <button
                  key={accent.name}
                  type="button"
                  onClick={() => onChange('accent', accent.name)}
                  aria-pressed={active}
                  className={`hairline flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-[13px] transition active:scale-95 ${
                    active
                      ? 'border-accent-400 bg-accent-500/10 font-medium'
                      : 'hover:border-accent-300'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="h-5 w-5 rounded-full ring-1 ring-black/10 dark:ring-white/15"
                    style={{ backgroundColor: accent.swatch }}
                  />
                  {accent.label}
                </button>
              );
            })}
          </div>
        </Group>

        <Group
          title="Motion"
          hint="Turn animations down if they're distracting. Your device's own reduce-motion setting is always respected."
        >
          <Segmented
            value={settings.motion}
            onChange={(v) => onChange('motion', v)}
            options={[
              { value: 'full', label: 'Full' },
              { value: 'reduced', label: 'Reduced' },
            ]}
          />
        </Group>

        <Group title="Timer sound" hint="The two-note chime when a timer finishes.">
          <Segmented
            value={settings.chime ? 'on' : 'off'}
            onChange={(v) => onChange('chime', v === 'on')}
            options={[
              { value: 'on', label: 'On' },
              { value: 'off', label: 'Off' },
            ]}
          />
        </Group>

        </div>

        <button
          type="button"
          onClick={onOpenPlugins}
          className="surface hairline group relative mt-7 flex w-full items-center gap-3 overflow-hidden rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-accent-300 hover:shadow-sm dark:hover:border-accent-700"
        >
          <QuartzCorner corner="br" className="text-accent-600" />
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-500/10 text-accent-700 dark:text-accent-300">
            <PuzzleIcon className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-medium">Plugins</span>
            <span className="muted block text-[12px]">
              {pluginCount === 0
                ? 'None installed — write one, or add a community one'
                : `${pluginCount} installed`}
            </span>
          </span>
          <ChevronRightIcon className="muted h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" />
        </button>

        <button
          type="button"
          onClick={onOpenAlarms}
          className="surface hairline group relative mt-2.5 flex w-full items-center gap-3 overflow-hidden rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-sm dark:hover:border-amber-700/60"
        >
          <QuartzCorner corner="br" className="text-amber-600" />
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
            <AlarmIcon className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-medium">Alarms</span>
            <span className="muted block text-[12px]">
              {alarmCount === 0 ? 'None set — ring at a time of day' : `${alarmCount} on`}
            </span>
          </span>
          <ChevronRightIcon className="muted h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" />
        </button>
      </main>
    </div>
  );
}

function Group({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7">
      <h2 className="text-[14px] font-medium">{title}</h2>
      <p className="muted mb-3 mt-0.5 text-[12px] leading-relaxed">{hint}</p>
      {children}
    </section>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div
      className="hairline inline-flex gap-0.5 rounded-xl border p-0.5"
      style={{ backgroundColor: 'rgb(var(--row))' }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`rounded-[9px] px-4 py-1.5 text-[13px] font-medium transition duration-200 ${
              active
                ? 'surface text-[rgb(var(--text))] shadow-sm'
                : 'muted hover:text-[rgb(var(--text))]'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
