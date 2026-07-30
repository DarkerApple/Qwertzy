import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSettings } from './hooks/useSettings';
import { usePlugins } from './hooks/usePlugins';
import { useAlarms } from './hooks/useAlarms';
import { usePinnedTimer } from './hooks/usePinnedTimer';
import { useRoute } from './hooks/useRoute';
import { go, routeToHash } from './lib/route';
import { mainStorage } from './lib/storage';
import { vaultExists } from './lib/vault';
import type { OpenVault } from './lib/vault';
import { Home } from './components/Home';
import { Guide } from './components/Guide';
import { Notebook } from './components/Notebook';
import { Settings } from './components/Settings';
import { Plugins } from './components/Plugins';
import { Alarms } from './components/Alarms';
import { Visualize } from './components/Visualize';
import { VaultGate } from './components/VaultGate';
import { CommandPalette } from './components/CommandPalette';
import { PinnedTimerWidget } from './components/PinnedTimerWidget';
import { TimerToast } from './components/TimerToast';
import { CommandIcon, MoonIcon, SunIcon } from './components/icons';
import { currentMonthKey } from './lib/time';

export default function App() {
  const route = useRoute();
  const { settings, update, toggleTheme, isDark } = useSettings();
  const plugins = usePlugins();
  const alarms = useAlarms();
  const pinned = usePinnedTimer();

  // The vault's key lives here and nowhere else: navigating around keeps it
  // open, reloading the page does not.
  const [vault, setVault] = useState<OpenVault | null>(null);
  const [hasVault, setHasVault] = useState(vaultExists);
  /** Notes a plugin command produced, handed to the notebook on arrival. */
  const [queued, setQueued] = useState<string[]>([]);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const goHome = useCallback(() => go({ name: 'home' }), []);
  const thisMonth = currentMonthKey();

  // ⌘K / Ctrl+K from anywhere, including while typing a note.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /**
   * The header's right-hand side, shared by every screen: the pinned timer,
   * the way to jump anywhere, and the theme. Passed down as one node so a new
   * control lands on all of them at once.
   */
  const chrome = (
    <>
      <PinnedTimerWidget
        timer={pinned.timer}
        remaining={pinned.remaining}
        onStart={pinned.start}
        onToggle={pinned.toggle}
        onReset={pinned.reset}
        onClear={pinned.clear}
      />
      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        aria-label="Go to…"
        title="Go to… (⌘K)"
        className="muted flex h-9 w-9 items-center justify-center rounded-xl transition duration-200 hover:text-[rgb(var(--text))]"
      >
        <CommandIcon />
      </button>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="muted flex h-9 w-9 items-center justify-center rounded-xl transition duration-200 hover:rotate-12 hover:text-[rgb(var(--text))]"
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>
    </>
  );

  // Flicking through months shouldn't fill the back stack with every month you
  // passed; the URL still points at where you are.
  const trackMonth = useCallback((month: string) => go({ name: 'month', month }, true), []);
  const trackSecretMonth = useCallback((month: string) => go({ name: 'secret', month }, true), []);

  const items = useMemo(() => mainStorage.load(), [route.name]);

  const screen = () => {
    if (route.name === 'guide') {
      return (
        <Guide
          onBack={goHome}
          onStart={() => go({ name: 'month', month: thisMonth })}
          chrome={chrome}
        />
      );
    }

    if (route.name === 'settings') {
      return (
        <Settings
          settings={settings}
          onChange={update}
          pluginCount={plugins.plugins.length}
          alarmCount={alarms.alarms.filter((a) => a.enabled).length}
          onOpenPlugins={() => go({ name: 'plugins' })}
          onOpenAlarms={() => go({ name: 'alarms' })}
          onBack={goHome}
          chrome={chrome}
        />
      );
    }

    if (route.name === 'alarms') {
      return (
        <Alarms
          alarms={alarms.alarms}
          onAdd={alarms.add}
          onRemove={alarms.remove}
          onSetEnabled={alarms.setEnabled}
          onBack={() => go({ name: 'settings' })}
          chrome={chrome}
        />
      );
    }

    if (route.name === 'visualize') {
      return (
        <Visualize
          items={items}
          month={route.month ?? thisMonth}
          onBack={goHome}
          onOpenMonth={(month) => go({ name: 'month', month })}
          chrome={chrome}
        />
      );
    }

    if (route.name === 'plugins') {
      return (
        <Plugins
          plugins={plugins.plugins}
          busy={plugins.busy}
          onInstall={plugins.install}
          onRemove={plugins.remove}
          onSetEnabled={plugins.setEnabled}
          onRunCommand={plugins.runCommand}
          // A command's notes belong on this month's page, so go there and
          // hand them over rather than writing behind the reader's back.
          onAddNotes={(notes) => {
            setQueued(notes);
            go({ name: 'month', month: thisMonth });
          }}
          onBack={() => go({ name: 'settings' })}
          chrome={chrome}
        />
      );
    }

    if (route.name === 'secret') {
      if (!vault) {
        return (
          <VaultGate
            exists={hasVault}
            onOpen={(opened) => {
              setVault(opened);
              setHasVault(true);
            }}
            onBack={goHome}
            onReset={() => setHasVault(false)}
            chrome={chrome}
          />
        );
      }
      return (
        <Notebook
          // Remounting on lock/unlock is deliberate: no notes from a closed
          // notebook can linger in component state.
          key="vault"
          storage={vault.storage}
          initialMonth={route.month}
          onMonthChange={trackSecretMonth}
          onHome={goHome}
          secret
          onLock={() => {
            setVault(null);
            goHome();
          }}
          onOpenSettings={() => go({ name: 'settings' })}
          onOpenVisualize={(month) => go({ name: 'visualize', month })}
          applyCapture={plugins.applyCapture}
          chrome={chrome}
        />
      );
    }

    if (route.name === 'month') {
      return (
        <Notebook
          key="main"
          storage={mainStorage}
          initialMonth={route.month}
          onMonthChange={trackMonth}
          onHome={goHome}
          onOpenSettings={() => go({ name: 'settings' })}
          onOpenVisualize={(month) => go({ name: 'visualize', month })}
          applyCapture={plugins.applyCapture}
          incoming={queued}
          onIncomingHandled={() => setQueued([])}
          chrome={chrome}
        />
      );
    }

    return (
      <Home
        items={items}
        vaultExists={hasVault}
        vaultOpen={vault !== null}
        alarmCount={alarms.alarms.filter((a) => a.enabled).length}
        onOpenMonth={(month) => go({ name: 'month', month })}
        onOpenGuide={() => go({ name: 'guide' })}
        onOpenSecret={() => go({ name: 'secret' })}
        onOpenSettings={() => go({ name: 'settings' })}
        onOpenVisualize={() => go({ name: 'visualize', month: thisMonth })}
        onOpenAlarms={() => go({ name: 'alarms' })}
        chrome={chrome}
      />
    );
  };

  return (
    <>
      {/* Keyed on the route so each screen animates in rather than snapping. */}
      <div key={routeToHash(route)} className="animate-page-in">
        {screen()}
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        items={items}
        onGoMonth={(month) => go({ name: 'month', month })}
        pages={[
          { id: 'home', label: 'Years', hint: 'All your notebooks', go: goHome },
          {
            id: 'this-month',
            label: 'This month',
            hint: 'Write something',
            go: () => go({ name: 'month', month: thisMonth }),
          },
          {
            id: 'visualize',
            label: 'Visualise',
            hint: 'The month as a tree, and a plotter',
            go: () => go({ name: 'visualize', month: thisMonth }),
          },
          { id: 'alarms', label: 'Alarms', hint: 'Ring at a time of day', go: () => go({ name: 'alarms' }) },
          { id: 'secret', label: 'Secret notes', hint: 'Behind a password', go: () => go({ name: 'secret' }) },
          { id: 'guide', label: 'How Qwertzy works', hint: 'The guide', go: () => go({ name: 'guide' }) },
          { id: 'settings', label: 'Settings', hint: 'Theme, accent, motion, sound', go: () => go({ name: 'settings' }) },
          { id: 'plugins', label: 'Plugins', hint: 'Install and write plugins', go: () => go({ name: 'plugins' }) },
        ]}
      />

      {/* Alarms ring wherever you are, so their banner lives at this level. */}
      <div
        className="pointer-events-none fixed inset-x-0 z-40 flex flex-col items-center gap-2 px-3"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
      >
        {alarms.ringing.map((ring) => (
          <TimerToast
            key={ring.id}
            text={`It's ${new Date(ring.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}.`}
            label={ring.label}
            onDismiss={() => alarms.dismiss(ring.id)}
          />
        ))}
      </div>
    </>
  );
}
