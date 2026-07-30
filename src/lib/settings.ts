/**
 * Everything the Settings page can change, in one place.
 *
 * Theme and accent are applied by writing attributes on <html>, which the
 * stylesheet reacts to — so a change lands everywhere at once without any
 * component needing to know about it.
 */
export type ThemeChoice = 'system' | 'light' | 'dark';
export type AccentName = 'indigo' | 'teal' | 'rose' | 'amber' | 'slate';
export type MotionChoice = 'full' | 'reduced';

export interface Settings {
  theme: ThemeChoice;
  accent: AccentName;
  motion: MotionChoice;
  /** The two-note chime when a timer finishes. */
  chime: boolean;
}

export const ACCENTS: { name: AccentName; label: string; swatch: string }[] = [
  { name: 'indigo', label: 'Indigo', swatch: '#5b51d8' },
  { name: 'teal', label: 'Teal', swatch: '#0f766e' },
  { name: 'rose', label: 'Rose', swatch: '#be123c' },
  { name: 'amber', label: 'Amber', swatch: '#b45309' },
  { name: 'slate', label: 'Graphite', swatch: '#475569' },
];

export const DEFAULTS: Settings = {
  theme: 'system',
  accent: 'indigo',
  motion: 'full',
  chime: true,
};

const KEY = 'qwertzy.settings.v1';
const LEGACY_THEME = ['qwertzy.theme', 'listify.theme'];

function isAccent(value: unknown): value is AccentName {
  return ACCENTS.some((a) => a.name === value);
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Settings>;
      return {
        theme: ['system', 'light', 'dark'].includes(parsed?.theme ?? '')
          ? (parsed.theme as ThemeChoice)
          : DEFAULTS.theme,
        accent: isAccent(parsed?.accent) ? parsed.accent : DEFAULTS.accent,
        motion: parsed?.motion === 'reduced' ? 'reduced' : 'full',
        chime: parsed?.chime !== false,
      };
    }
    // Before there was a Settings page there was just a light/dark toggle.
    for (const key of LEGACY_THEME) {
      const old = localStorage.getItem(key);
      if (old === 'dark' || old === 'light') return { ...DEFAULTS, theme: old };
    }
  } catch {
    /* unreadable storage — defaults are fine */
  }
  return { ...DEFAULTS };
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* quota or private mode */
  }
}

export function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveDark(theme: ThemeChoice): boolean {
  return theme === 'system' ? systemPrefersDark() : theme === 'dark';
}

/** Push the settings onto <html>, where the stylesheet can see them. */
export function applySettings(settings: Settings): void {
  const root = document.documentElement;
  root.classList.toggle('dark', resolveDark(settings.theme));
  root.dataset.accent = settings.accent;
  root.dataset.motion = settings.motion;
}
