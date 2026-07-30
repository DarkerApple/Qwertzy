import { useCallback, useMemo, useState } from 'react';
import { useSettings } from './hooks/useSettings';
import { usePlugins } from './hooks/usePlugins';
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
import { VaultGate } from './components/VaultGate';
import { MoonIcon, SunIcon } from './components/icons';
import { currentMonthKey } from './lib/time';

export default function App() {
  const route = useRoute();
  const { settings, update, toggleTheme, isDark } = useSettings();
  const plugins = usePlugins();

  // The vault's key lives here and nowhere else: navigating around keeps it
  // open, reloading the page does not.
  const [vault, setVault] = useState<OpenVault | null>(null);
  const [hasVault, setHasVault] = useState(vaultExists);
  /** Notes a plugin command produced, handed to the notebook on arrival. */
  const [queued, setQueued] = useState<string[]>([]);

  const themeToggle = (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="muted flex h-9 w-9 items-center justify-center rounded-xl transition duration-200 hover:rotate-12 hover:text-[rgb(var(--text))]"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );

  const goHome = useCallback(() => go({ name: 'home' }), []);

  // Flicking through months shouldn't fill the back stack with every month you
  // passed; the URL still points at where you are.
  const trackMonth = useCallback((month: string) => go({ name: 'month', month }, true), []);
  const trackSecretMonth = useCallback((month: string) => go({ name: 'secret', month }, true), []);

  const screen = () => {
    if (route.name === 'guide') {
      return (
        <Guide
          onBack={goHome}
          onStart={() => go({ name: 'month', month: currentMonthKey() })}
          themeToggle={themeToggle}
        />
      );
    }

    if (route.name === 'settings') {
      return (
        <Settings
          settings={settings}
          onChange={update}
          pluginCount={plugins.plugins.length}
          onOpenPlugins={() => go({ name: 'plugins' })}
          onBack={goHome}
          themeToggle={themeToggle}
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
            go({ name: 'month', month: currentMonthKey() });
          }}
          onBack={() => go({ name: 'settings' })}
          themeToggle={themeToggle}
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
            themeToggle={themeToggle}
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
          applyCapture={plugins.applyCapture}
          themeToggle={themeToggle}
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
          applyCapture={plugins.applyCapture}
          incoming={queued}
          onIncomingHandled={() => setQueued([])}
          themeToggle={themeToggle}
        />
      );
    }

    return (
      <HomeScreen
        vaultOpen={vault !== null}
        hasVault={hasVault}
        themeToggle={themeToggle}
      />
    );
  };

  // Keyed on the route so each screen animates in rather than snapping.
  return (
    <div key={routeToHash(route)} className="animate-page-in">
      {screen()}
    </div>
  );
}

/**
 * Home reads the notebook straight from storage rather than mounting the data
 * hook: it's a contents page, and it's rebuilt every time you come back to it.
 */
function HomeScreen({
  vaultOpen,
  hasVault,
  themeToggle,
}: {
  vaultOpen: boolean;
  hasVault: boolean;
  themeToggle: React.ReactNode;
}) {
  const items = useMemo(() => mainStorage.load(), []);
  return (
    <Home
      items={items}
      vaultExists={hasVault}
      vaultOpen={vaultOpen}
      onOpenMonth={(month) => go({ name: 'month', month })}
      onOpenGuide={() => go({ name: 'guide' })}
      onOpenSecret={() => go({ name: 'secret' })}
      onOpenSettings={() => go({ name: 'settings' })}
      themeToggle={themeToggle}
    />
  );
}
