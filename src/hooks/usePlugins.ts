import { useCallback, useEffect, useRef, useState } from 'react';
import type { Plugin } from '../lib/plugins';
import { host, loadPlugins, savePlugins, toNotes } from '../lib/plugins';
import { newId } from '../lib/id';

/**
 * The installed plugins, kept loaded in the worker and re-loaded whenever the
 * set of enabled ones changes.
 */
export function usePlugins() {
  const [plugins, setPlugins] = useState<Plugin[]>(loadPlugins);
  const [busy, setBusy] = useState(false);
  // Re-loading depends only on which sources are enabled, not on the manifests
  // that loading itself writes back — otherwise it would loop forever.
  const signature = plugins
    .filter((p) => p.enabled)
    .map((p) => `${p.id}:${p.source.length}`)
    .join('|');
  const mounted = useRef(true);

  useEffect(() => () => {
    mounted.current = false;
    host.dispose();
  }, []);

  useEffect(() => {
    savePlugins(plugins);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plugins.map((p) => `${p.id}:${p.enabled}`).join('|'), plugins.length]);

  useEffect(() => {
    let cancelled = false;
    host.dispose();
    const enabled = plugins.filter((p) => p.enabled);
    if (enabled.length === 0) return;

    setBusy(true);
    void (async () => {
      const results = new Map<string, { manifest?: Plugin['manifest']; error?: string }>();
      for (const plugin of enabled) {
        results.set(plugin.id, await host.load(plugin));
      }
      if (cancelled || !mounted.current) return;
      setPlugins((prev) =>
        prev.map((p) => {
          const result = results.get(p.id);
          if (!result) return p;
          return { ...p, manifest: result.manifest ?? null, error: result.error ?? null };
        }),
      );
      setBusy(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const install = useCallback((source: string, origin: string | null = null) => {
    const plugin: Plugin = {
      id: newId(),
      source,
      enabled: true,
      addedAt: Date.now(),
      origin,
      manifest: null,
      error: null,
    };
    setPlugins((prev) => [...prev, plugin]);
    return plugin.id;
  }, []);

  const remove = useCallback((id: string) => {
    setPlugins((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const setEnabled = useCallback((id: string, enabled: boolean) => {
    setPlugins((prev) => prev.map((p) => (p.id === id ? { ...p, enabled } : p)));
  }, []);

  /**
   * Run what was written through every enabled onCapture, in install order.
   * A plugin that fails, times out or returns nothing usable leaves the text
   * exactly as it was — writing must never be lost to someone else's code.
   */
  const applyCapture = useCallback(
    async (text: string): Promise<string[]> => {
      const enabled = plugins.filter((p) => p.enabled && p.manifest?.hooks.includes('onCapture'));
      if (enabled.length === 0) return [text];

      let current = [text];
      for (const plugin of enabled) {
        const next: string[] = [];
        for (const one of current) {
          const value = await host.call(plugin.id, 'onCapture', [one]);
          const produced = toNotes(value);
          next.push(...(produced.length ? produced : [one]));
        }
        current = next;
      }
      return current;
    },
    [plugins],
  );

  const runCommand = useCallback(async (pluginId: string, commandId: string): Promise<string[]> => {
    const value = await host.call(pluginId, 'command', [], commandId);
    return toNotes(value);
  }, []);

  return { plugins, busy, install, remove, setEnabled, applyCapture, runCommand };
}
