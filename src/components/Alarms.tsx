import { useState } from 'react';
import type { Alarm, Repeat } from '../lib/alarms';
import { describeNext, describeRepeat, nextRing } from '../lib/alarms';
import { ChevronLeftIcon, PlusIcon, TrashIcon } from './icons';

interface Props {
  alarms: Alarm[];
  onAdd: (time: string, label: string, repeat: Repeat, weekday: number) => void;
  onRemove: (id: string) => void;
  onSetEnabled: (id: string, enabled: boolean) => void;
  onBack: () => void;
  chrome: React.ReactNode;
}

const REPEATS: { value: Repeat; label: string }[] = [
  { value: 'once', label: 'Once' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekly', label: 'Weekly' },
];

const DAYS = Array.from({ length: 7 }, (_, i) =>
  new Date(2024, 0, 7 + i).toLocaleDateString(undefined, { weekday: 'short' }),
);

export function Alarms({ alarms, onAdd, onRemove, onSetEnabled, onBack, chrome }: Props) {
  const [time, setTime] = useState('08:00');
  const [label, setLabel] = useState('');
  const [repeat, setRepeat] = useState<Repeat>('daily');
  const [weekday, setWeekday] = useState(new Date().getDay());

  const sorted = [...alarms].sort((a, b) => a.time.localeCompare(b.time));

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
          <div className="ml-auto flex items-center gap-0.5">{chrome}</div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-3 sm:px-5 lg:max-w-4xl">
        <h1 className="font-display text-[34px] leading-[1.05] tracking-tight sm:text-[42px]">
          Alarms
        </h1>
        <p className="muted mt-2 text-[13px]">
          Ring at a time of day, once or on repeat — separate from the timers you write into notes.
        </p>

        <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-5">
          <div className="space-y-2.5">
            {sorted.length === 0 && (
              <div className="hairline rounded-2xl border border-dashed px-6 py-10 text-center">
                <p className="font-display text-[19px]">No alarms</p>
                <p className="muted mx-auto mt-2 max-w-sm text-[13px] leading-relaxed">
                  Set one for a time of day and it'll ring while Qwertzy is open — with a
                  notification, the chime and a banner.
                </p>
              </div>
            )}

            {sorted.map((alarm) => (
              <div
                key={alarm.id}
                className={`surface hairline animate-pop-in flex items-center gap-3 rounded-2xl border p-4 ${
                  alarm.enabled ? '' : 'opacity-60'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[24px] leading-none tabular-nums">{alarm.time}</p>
                  <p className="mt-1.5 truncate text-[13px]">
                    {alarm.label.trim() || <span className="muted">No label</span>}
                  </p>
                  <p className="muted mt-0.5 text-[11px]">
                    {describeRepeat(alarm)} ·{' '}
                    {nextRing(alarm) === null && alarm.repeat === 'once'
                      ? 'already rang'
                      : describeNext(alarm)}
                  </p>
                </div>
                <Switch
                  checked={alarm.enabled}
                  onChange={() => onSetEnabled(alarm.id, !alarm.enabled)}
                  label={alarm.label.trim() || `alarm at ${alarm.time}`}
                />
                <button
                  type="button"
                  onClick={() => onRemove(alarm.id)}
                  aria-label={`Delete alarm at ${alarm.time}`}
                  className="muted rounded-lg p-1.5 transition hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                >
                  <TrashIcon className="h-[15px] w-[15px]" />
                </button>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!/^\d{2}:\d{2}$/.test(time)) return;
              onAdd(time, label.trim(), repeat, weekday);
              setLabel('');
            }}
            className="surface hairline mt-4 rounded-2xl border p-4 lg:mt-0"
          >
            <h2 className="text-[14px] font-medium">New alarm</h2>

            <label className="muted mt-3 block text-[12px]" htmlFor="alarm-time">
              Time
            </label>
            <input
              id="alarm-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="surface hairline mt-1 w-full rounded-xl border px-3 py-2 text-[15px] tabular-nums focus:border-accent-400 focus:outline-none"
            />

            <label className="muted mt-3 block text-[12px]" htmlFor="alarm-label">
              Label
            </label>
            <input
              id="alarm-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Stand up and stretch"
              className="surface hairline mt-1 w-full rounded-xl border px-3 py-2 text-[14px] focus:border-accent-400 focus:outline-none"
            />

            <p className="muted mt-3 text-[12px]">Repeat</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {REPEATS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRepeat(option.value)}
                  aria-pressed={repeat === option.value}
                  className={`hairline rounded-full border px-3 py-1.5 text-[12px] transition ${
                    repeat === option.value
                      ? 'border-accent-400 bg-accent-500/10 font-medium'
                      : 'hover:border-accent-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {repeat === 'weekly' && (
              <div className="animate-slide-up mt-2 flex flex-wrap gap-1">
                {DAYS.map((day, index) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setWeekday(index)}
                    aria-pressed={weekday === index}
                    className={`hairline w-11 rounded-lg border py-1 text-[11px] transition ${
                      weekday === index ? 'border-accent-400 bg-accent-500/10 font-medium' : ''
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}

            <button
              type="submit"
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-accent-600 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-accent-700 dark:bg-accent-500 dark:hover:bg-accent-400"
            >
              <PlusIcon className="h-4 w-4" />
              Add alarm
            </button>

            <p className="muted mt-3 text-[11px] leading-relaxed">
              Alarms ring while Qwertzy is open in a tab — there's no background service. One that
              came due while it was closed is skipped rather than rung late, and a repeating alarm
              moves on to its next time.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`${checked ? 'Turn off' : 'Turn on'} ${label}`}
      onClick={onChange}
      className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200 ${
        checked ? 'bg-accent-600 dark:bg-accent-500' : 'bg-ink-300 dark:bg-ink-700'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-[18px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
