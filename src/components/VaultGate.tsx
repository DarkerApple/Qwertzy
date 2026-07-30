import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeftIcon, LockIcon } from './icons';
import { cryptoAvailable, createVault, destroyVault, unlockVault } from '../lib/vault';
import type { OpenVault } from '../lib/vault';

interface Props {
  exists: boolean;
  onOpen: (vault: OpenVault) => void;
  onBack: () => void;
  onReset: () => void;
  themeToggle: ReactNode;
}

/**
 * The door to the secret notebook: set a password the first time, enter it
 * after that. Deriving the key is deliberately slow, so the button says so.
 */
export function VaultGate({ exists, onOpen, onBack, onReset, themeToggle }: Props) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const supported = cryptoAvailable();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    if (!password) {
      setError('Enter a password.');
      return;
    }
    if (!exists) {
      if (password.length < 6) {
        setError('Use at least 6 characters.');
        return;
      }
      if (password !== confirm) {
        setError('The two passwords don’t match.');
        return;
      }
    }

    setBusy(true);
    // Deriving the key takes a moment by design; yield first so the button can
    // actually paint its "Unlocking…" state.
    await new Promise((resolve) => setTimeout(resolve, 0));
    const result = exists ? await unlockVault(password) : await createVault(password);
    setBusy(false);

    if (result.ok) {
      setPassword('');
      setConfirm('');
      onOpen(result.vault);
      return;
    }
    setError(
      result.reason === 'wrong-password'
        ? 'That password doesn’t open these notes.'
        : result.reason === 'missing'
          ? 'There are no secret notes yet.'
          : 'This browser can’t encrypt notes here.',
    );
  }

  function reset() {
    const sure = window.confirm(
      'Delete the secret notes and start over?\n\nThey are encrypted, so without the password there is no way to read them — and no way to get them back after this.',
    );
    if (!sure) return;
    destroyVault();
    setPassword('');
    setConfirm('');
    setError(null);
    onReset();
  }

  const field =
    'surface hairline w-full rounded-xl border px-3 py-2.5 text-[15px] focus:border-accent-400 focus:outline-none';

  return (
    <div className="page">
      <header
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{ height: 'var(--header-h)', backgroundColor: 'rgb(var(--paper) / 0.82)' }}
      >
        <div className="mx-auto flex h-full max-w-2xl items-center gap-1 px-3 sm:px-4">
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

      <main className="mx-auto w-full max-w-md px-4 pb-16 pt-6">
        <div className="surface hairline rounded-3xl border p-6 shadow-sheet sm:p-7">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
            <LockIcon className="h-5 w-5" />
          </span>
          <h1 className="font-display mt-3 text-[26px] leading-tight tracking-tight">
            {exists ? 'Secret notes' : 'Set up secret notes'}
          </h1>
          <p className="muted mt-1.5 text-[13px] leading-relaxed">
            {exists
              ? 'A second notebook that works exactly like the first — months, timers, threads — but only opens with your password.'
              : 'A second notebook that works exactly like the first. It’s encrypted with your password, so nothing readable is stored until you unlock it.'}
          </p>

          {!supported ? (
            <p className="mt-4 rounded-xl bg-amber-500/10 px-3 py-2.5 text-[13px] leading-relaxed text-amber-800 dark:text-amber-200">
              Encryption needs a secure page (https or localhost). Open Qwertzy over https and this
              will work.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-5 space-y-2.5">
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={exists ? 'current-password' : 'new-password'}
                placeholder="Password"
                aria-label="Password"
                className={field}
              />
              {!exists && (
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Password again"
                  aria-label="Confirm password"
                  className={field}
                />
              )}

              {error && (
                <p role="alert" className="text-[12px] text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-accent-600 px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-accent-700 disabled:opacity-60 dark:bg-accent-500 dark:hover:bg-accent-400"
              >
                {busy ? 'Working…' : exists ? 'Unlock' : 'Create secret notes'}
              </button>
            </form>
          )}

          <p className="muted mt-4 text-[11px] leading-relaxed">
            {exists
              ? 'The password is never stored, so it can’t be recovered or reset — only the notes can be deleted.'
              : 'The password is never stored anywhere. If you forget it, these notes can’t be recovered — that’s what makes them secret.'}
          </p>

          {exists && (
            <button
              type="button"
              onClick={reset}
              className="muted mt-3 text-[12px] underline decoration-dotted underline-offset-2 transition hover:text-red-600 dark:hover:text-red-400"
            >
              Forgot it — delete these notes and start over
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
