/**
 * Community plugins.
 *
 * A plugin is a small piece of JavaScript someone else wrote, so the question
 * that matters is what it can reach. The answer here: very little. Plugins run
 * in a Web Worker, which has no DOM and no access to the page's localStorage,
 * and the bootstrap below removes the network — fetch, XMLHttpRequest,
 * WebSocket, EventSource, sendBeacon — plus importScripts and Worker, so a
 * plugin can't pull in more code or spawn a fresh global to get them back. It
 * sees only the text handed to it and returns text back.
 *
 * That is a real barrier rather than a formal sandbox: it closes the routes a
 * plugin would actually use, and the app says as much on the Plugins page so
 * nobody installs a stranger's code believing it's been proven harmless.
 *
 * Every call is also raced against a timeout, so a plugin stuck in a loop
 * delays one capture rather than freezing the app.
 */
export interface PluginCommand {
  id: string;
  label: string;
}

export interface PluginManifest {
  name: string;
  description: string;
  version: string;
  hooks: string[];
  commands: PluginCommand[];
}

export interface Plugin {
  id: string;
  source: string;
  enabled: boolean;
  addedAt: number;
  /** Where it came from, when it was fetched rather than pasted. */
  origin: string | null;
  manifest: PluginManifest | null;
  error: string | null;
}

const KEY = 'qwertzy.plugins.v1';
const CALL_TIMEOUT_MS = 1500;

/* ------------------------------------------------------------------ storage */

export function loadPlugins(): Plugin[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((p) => {
      if (!p || typeof p !== 'object') return [];
      const o = p as Record<string, unknown>;
      if (typeof o.id !== 'string' || typeof o.source !== 'string') return [];
      return [
        {
          id: o.id,
          source: o.source,
          enabled: o.enabled !== false,
          addedAt: typeof o.addedAt === 'number' ? o.addedAt : Date.now(),
          origin: typeof o.origin === 'string' ? o.origin : null,
          manifest: null,
          error: null,
        },
      ];
    });
  } catch {
    return [];
  }
}

export function savePlugins(plugins: Plugin[]): void {
  try {
    // Manifests are re-derived on load, so only the source is worth keeping.
    const slim = plugins.map(({ id, source, enabled, addedAt, origin }) => ({
      id,
      source,
      enabled,
      addedAt,
      origin,
    }));
    localStorage.setItem(KEY, JSON.stringify(slim));
  } catch {
    /* quota or private mode */
  }
}

/* ------------------------------------------------------------------- worker */

const BOOTSTRAP = String.raw`
// Shut the doors before any plugin code is evaluated.
//
// Plain assignment is not enough: these live on WorkerGlobalScope.prototype as
// accessors, so "self.fetch = undefined" fails silently and fetch stays. Define
// an own undefined property to shadow it, then walk the prototype chain and
// delete it there too. Worker goes as well: a nested worker would hand the
// plugin a fresh global with the network back.
['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts', 'Worker', 'SharedWorker', 'BroadcastChannel', 'RTCPeerConnection'].forEach(function (name) {
  try {
    Object.defineProperty(self, name, { value: undefined, writable: true, configurable: true });
  } catch (e) { /* ignore */ }
  try {
    var proto = Object.getPrototypeOf(self);
    while (proto) {
      if (Object.prototype.hasOwnProperty.call(proto, name)) delete proto[name];
      proto = Object.getPrototypeOf(proto);
    }
  } catch (e) { /* ignore */ }
});
try {
  // The other quiet way out.
  if (self.navigator && self.navigator.sendBeacon) self.navigator.sendBeacon = undefined;
} catch (e) { /* ignore */ }

var registry = new Map();
var loading = null;

self.qwertzy = {
  plugin: function (def) {
    if (loading) registry.set(loading, def || {});
  },
};

function describe(id, def) {
  var commands = Array.isArray(def.commands)
    ? def.commands
        .filter(function (c) { return c && typeof c.id === 'string'; })
        .map(function (c) { return { id: c.id, label: String(c.label || c.id) }; })
    : [];
  var hooks = [];
  if (typeof def.onCapture === 'function') hooks.push('onCapture');
  if (commands.length) hooks.push('commands');
  return {
    name: String(def.name || id),
    description: String(def.description || ''),
    version: String(def.version || '0.0.0'),
    hooks: hooks,
    commands: commands,
  };
}

self.onmessage = function (event) {
  var msg = event.data || {};

  if (msg.type === 'load') {
    loading = msg.id;
    try {
      registry.delete(msg.id);
      (0, eval)(msg.source);
      var def = registry.get(msg.id);
      if (!def) throw new Error('The plugin never called qwertzy.plugin({...}).');
      self.postMessage({ type: 'loaded', id: msg.id, manifest: describe(msg.id, def) });
    } catch (err) {
      self.postMessage({ type: 'failed', id: msg.id, message: String((err && err.message) || err) });
    }
    loading = null;
    return;
  }

  if (msg.type === 'call') {
    try {
      var plugin = registry.get(msg.id);
      if (!plugin) throw new Error('Plugin is not loaded.');
      var value;
      if (msg.hook === 'onCapture') {
        value = plugin.onCapture.apply(plugin, msg.args);
      } else if (msg.hook === 'command') {
        var command = (plugin.commands || []).filter(function (c) { return c.id === msg.commandId; })[0];
        if (!command || typeof command.run !== 'function') throw new Error('No such command.');
        value = command.run();
      } else {
        throw new Error('Unknown hook.');
      }
      self.postMessage({ type: 'result', callId: msg.callId, value: value });
    } catch (err) {
      self.postMessage({
        type: 'result',
        callId: msg.callId,
        error: String((err && err.message) || err),
      });
    }
  }
};
`;

type Pending = { resolve: (value: unknown) => void; timer: number };

/** One worker for all plugins, restarted whenever the set of them changes. */
class Host {
  private worker: Worker | null = null;
  private url: string | null = null;
  private pending = new Map<number, Pending>();
  private nextCall = 1;
  private loaded = new Map<string, (result: { manifest?: PluginManifest; error?: string }) => void>();

  private ensure(): Worker {
    if (this.worker) return this.worker;
    this.url = URL.createObjectURL(new Blob([BOOTSTRAP], { type: 'text/javascript' }));
    const worker = new Worker(this.url);
    worker.onmessage = (event: MessageEvent) => {
      const msg = event.data ?? {};
      if (msg.type === 'loaded' || msg.type === 'failed') {
        const settle = this.loaded.get(msg.id);
        this.loaded.delete(msg.id);
        settle?.(msg.type === 'loaded' ? { manifest: msg.manifest } : { error: msg.message });
        return;
      }
      if (msg.type === 'result') {
        const pending = this.pending.get(msg.callId);
        if (!pending) return;
        this.pending.delete(msg.callId);
        window.clearTimeout(pending.timer);
        pending.resolve(msg.error ? null : msg.value);
      }
    };
    // A plugin that throws at the top level takes the worker down; start a
    // fresh one rather than leaving every later call hanging.
    worker.onerror = () => this.dispose();
    this.worker = worker;
    return worker;
  }

  dispose(): void {
    this.worker?.terminate();
    this.worker = null;
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = null;
    for (const [, pending] of this.pending) {
      window.clearTimeout(pending.timer);
      pending.resolve(null);
    }
    this.pending.clear();
    this.loaded.clear();
  }

  load(plugin: Plugin): Promise<{ manifest?: PluginManifest; error?: string }> {
    const worker = this.ensure();
    return new Promise((resolve) => {
      const timer = window.setTimeout(
        () => resolve({ error: 'Timed out while loading.' }),
        CALL_TIMEOUT_MS,
      );
      this.loaded.set(plugin.id, (result) => {
        window.clearTimeout(timer);
        resolve(result);
      });
      worker.postMessage({ type: 'load', id: plugin.id, source: plugin.source });
    });
  }

  call(id: string, hook: 'onCapture' | 'command', args: unknown[], commandId?: string) {
    const worker = this.ensure();
    const callId = this.nextCall++;
    return new Promise<unknown>((resolve) => {
      const timer = window.setTimeout(() => {
        this.pending.delete(callId);
        resolve(null);
      }, CALL_TIMEOUT_MS);
      this.pending.set(callId, { resolve, timer });
      worker.postMessage({ type: 'call', callId, id, hook, args, commandId });
    });
  }
}

export const host = new Host();

/** Plugins may return a string, a list of strings, or nothing. */
export function toNotes(value: unknown): string[] {
  if (typeof value === 'string') return value.trim() ? [value] : [];
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  }
  return [];
}
