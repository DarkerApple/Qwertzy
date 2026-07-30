import { useState } from 'react';
import type { Plugin } from '../lib/plugins';
import { ChevronLeftIcon, HelpIcon, PlusIcon, TrashIcon } from './icons';
import { PluginGuide } from './PluginGuide';

interface Props {
  plugins: Plugin[];
  busy: boolean;
  onInstall: (source: string, origin: string | null) => void;
  onRemove: (id: string) => void;
  onSetEnabled: (id: string, enabled: boolean) => void;
  onRunCommand: (pluginId: string, commandId: string) => Promise<string[]>;
  onAddNotes: (notes: string[]) => void;
  onBack: () => void;
  themeToggle: React.ReactNode;
}

export function Plugins({
  plugins,
  busy,
  onInstall,
  onRemove,
  onSetEnabled,
  onRunCommand,
  onAddNotes,
  onBack,
  themeToggle,
}: Props) {
  const [showGuide, setShowGuide] = useState(false);
  const [adding, setAdding] = useState(false);
  const [source, setSource] = useState('');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [ran, setRan] = useState<string | null>(null);

  async function fetchFromUrl() {
    if (!url.trim()) return;
    setStatus('Fetching…');
    try {
      const response = await fetch(url.trim());
      if (!response.ok) throw new Error(`The link answered ${response.status}.`);
      const text = await response.text();
      setSource(text);
      setStatus('Fetched — read it, then install.');
    } catch (error) {
      setStatus(
        `Couldn't fetch that: ${error instanceof Error ? error.message : 'unknown error'}. The site may not allow it; paste the source instead.`,
      );
    }
  }

  function install() {
    if (!source.trim()) return;
    onInstall(source, url.trim() || null);
    setSource('');
    setUrl('');
    setStatus(null);
    setAdding(false);
  }

  async function run(plugin: Plugin, commandId: string, label: string) {
    const notes = await onRunCommand(plugin.id, commandId);
    if (notes.length === 0) {
      setRan(`"${label}" didn't return anything.`);
      return;
    }
    onAddNotes(notes);
    setRan(`Added ${notes.length} ${notes.length === 1 ? 'note' : 'notes'} from "${label}".`);
  }

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
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[34px] leading-[1.05] tracking-tight sm:text-[42px]">
              Plugins
            </h1>
            <p className="muted mt-2 text-[13px]">
              Small pieces of JavaScript that change what happens when you write.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowGuide((v) => !v)}
            aria-expanded={showGuide}
            aria-label={showGuide ? 'Hide the plugin guide' : 'How do plugins work?'}
            title="How do plugins work?"
            className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition active:scale-95 ${
              showGuide
                ? 'border-accent-400 bg-accent-500/10 text-accent-700 dark:text-accent-300'
                : 'hairline muted hover:border-accent-300 hover:text-accent-700 dark:hover:text-accent-300'
            }`}
          >
            <HelpIcon className="h-[18px] w-[18px]" />
          </button>
        </div>

        {showGuide && <PluginGuide />}

        <div className="mt-6 space-y-2.5">
          {plugins.length === 0 && !adding && (
            <div className="hairline rounded-2xl border border-dashed px-6 py-10 text-center">
              <p className="font-display text-[19px]">Nothing installed</p>
              <p className="muted mx-auto mt-2 max-w-sm text-[13px] leading-relaxed">
                Plugins can rewrite what you type, split one line into several, or add a set of
                notes on demand. Tap the <span className="font-medium">?</span> above to see how one
                is written.
              </p>
            </div>
          )}

          {plugins.map((plugin) => (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              busy={busy}
              onToggle={() => onSetEnabled(plugin.id, !plugin.enabled)}
              onRemove={() => {
                if (window.confirm(`Remove "${plugin.manifest?.name ?? 'this plugin'}"?`)) {
                  onRemove(plugin.id);
                }
              }}
              onRun={(commandId, label) => void run(plugin, commandId, label)}
            />
          ))}
        </div>

        {ran && (
          <p className="animate-slide-up mt-3 text-[12px] text-accent-700 dark:text-accent-300">
            {ran}
          </p>
        )}

        {adding ? (
          <div className="animate-slide-up surface hairline mt-4 rounded-2xl border p-4">
            <h2 className="text-[14px] font-medium">Add a plugin</h2>

            <label className="muted mt-3 block text-[12px]" htmlFor="plugin-url">
              From a link
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="plugin-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…/plugin.js"
                className="surface hairline min-w-0 flex-1 rounded-xl border px-3 py-2 text-[14px] focus:border-accent-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void fetchFromUrl()}
                className="hairline shrink-0 rounded-xl border px-3 py-2 text-[13px] font-medium transition hover:border-accent-300"
              >
                Fetch
              </button>
            </div>

            <label className="muted mt-4 block text-[12px]" htmlFor="plugin-source">
              Source — read it before installing
            </label>
            <textarea
              id="plugin-source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              rows={8}
              spellCheck={false}
              placeholder={"qwertzy.plugin({\n  name: 'My plugin',\n  version: '1.0.0',\n  onCapture(text) { return text; },\n});"}
              className="surface hairline mt-1 w-full resize-y rounded-xl border p-3 font-mono text-[12px] leading-relaxed focus:border-accent-400 focus:outline-none"
            />

            {status && <p className="muted mt-2 text-[12px]">{status}</p>}

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={install}
                disabled={!source.trim()}
                className="rounded-xl bg-accent-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-accent-700 disabled:opacity-40 dark:bg-accent-500 dark:hover:bg-accent-400"
              >
                Install
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setStatus(null);
                }}
                className="muted rounded-xl px-3 py-2 text-[13px] transition hover:text-[rgb(var(--text))]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="hairline mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-3 text-[13px] font-medium transition hover:border-accent-300 hover:text-accent-700 dark:hover:text-accent-300"
          >
            <PlusIcon className="h-4 w-4" />
            Add a plugin
          </button>
        )}
      </main>
    </div>
  );
}

function PluginCard({
  plugin,
  busy,
  onToggle,
  onRemove,
  onRun,
}: {
  plugin: Plugin;
  busy: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onRun: (commandId: string, label: string) => void;
}) {
  const [showSource, setShowSource] = useState(false);
  const manifest = plugin.manifest;

  return (
    <div className="surface hairline animate-pop-in rounded-2xl border p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[14px] font-medium">
            {manifest?.name ?? (plugin.enabled ? 'Loading…' : 'Disabled plugin')}
            {manifest && (
              <span className="muted text-[11px] font-normal tabular-nums">
                v{manifest.version}
              </span>
            )}
          </p>
          <p className="muted mt-0.5 text-[12px] leading-relaxed">
            {plugin.error
              ? plugin.error
              : manifest?.description ||
                (plugin.enabled && busy ? 'Loading…' : 'Turn it on to load it.')}
          </p>
          {plugin.origin && (
            <p className="muted mt-1 truncate text-[11px]" title={plugin.origin}>
              {plugin.origin}
            </p>
          )}
        </div>

        <Switch checked={plugin.enabled} onChange={onToggle} label={manifest?.name ?? 'plugin'} />
      </div>

      {plugin.error && (
        <p className="mt-2 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-[12px] text-red-700 dark:text-red-300">
          It didn't load. Check the source below.
        </p>
      )}

      {manifest && manifest.commands.length > 0 && plugin.enabled && (
        <div className="mt-3 flex flex-wrap gap-2">
          {manifest.commands.map((command) => (
            <button
              key={command.id}
              type="button"
              onClick={() => onRun(command.id, command.label)}
              className="hairline rounded-full border px-3 py-1.5 text-[12px] font-medium transition hover:border-accent-300 hover:text-accent-700 active:scale-95 dark:hover:text-accent-300"
            >
              {command.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowSource((v) => !v)}
          className="muted text-[12px] underline decoration-dotted underline-offset-2 transition hover:text-[rgb(var(--text))]"
        >
          {showSource ? 'Hide source' : 'View source'}
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove plugin"
          className="muted ml-auto rounded-lg p-1.5 transition hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
        >
          <TrashIcon className="h-[15px] w-[15px]" />
        </button>
      </div>

      {showSource && (
        <pre
          className="hairline animate-slide-up mt-2 max-h-64 overflow-auto rounded-xl border p-3 text-[11px] leading-relaxed"
          style={{ backgroundColor: 'rgb(var(--row))' }}
        >
          <code>{plugin.source}</code>
        </pre>
      )}
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
      aria-label={`${checked ? 'Disable' : 'Enable'} ${label}`}
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
