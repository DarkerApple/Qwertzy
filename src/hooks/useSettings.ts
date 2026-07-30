import { useCallback, useEffect, useState } from 'react';
import type { Settings } from '../lib/settings';
import { applySettings, loadSettings, saveSettings, systemPrefersDark } from '../lib/settings';

/**
 * The app's settings, applied to <html> whenever they change and followed back
 * to the OS while the theme is set to "system".
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  useEffect(() => {
    applySettings(settings);
    saveSettings(settings);
  }, [settings]);

  // "System" means system — keep up if the OS flips while the app is open.
  useEffect(() => {
    if (settings.theme !== 'system') return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applySettings(settings);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [settings]);

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  /** What the header's one-tap toggle does: flip to the opposite of what's shown. */
  const toggleTheme = useCallback(() => {
    setSettings((prev) => {
      const showingDark = prev.theme === 'system' ? systemPrefersDark() : prev.theme === 'dark';
      return { ...prev, theme: showingDark ? 'light' : 'dark' };
    });
  }, []);

  const isDark =
    settings.theme === 'system' ? systemPrefersDark() : settings.theme === 'dark';

  return { settings, update, toggleTheme, isDark };
}
