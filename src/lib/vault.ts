import type { Item } from '../types';
import type { NotebookStorage } from './storage';
import { parseImport } from './storage';

/**
 * The secret notebook.
 *
 * The password isn't a curtain over a normal list — it's the key. Notes are
 * encrypted with AES-GCM under a key derived from the password (PBKDF2,
 * SHA-256, 310k iterations), and only the ciphertext is ever written to disk.
 * Nothing derived from the password is stored, so a wrong password is
 * indistinguishable from a corrupt file and a forgotten one is unrecoverable —
 * which is the point.
 *
 * The key lives in memory for the length of the session only: reload, and the
 * notebook is locked again.
 */
const BLOB_KEY = 'qwertzy.vault.v1';
// The same blob under its pre-rename name; read as a fallback, never deleted.
const LEGACY_BLOB_KEY = 'listify.vault.v1';
const ITERATIONS = 310_000;

interface VaultBlob {
  v: 1;
  salt: string;
  iv: string;
  data: string;
}

export function cryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && 'subtle' in crypto;
}

export function vaultExists(): boolean {
  try {
    return localStorage.getItem(BLOB_KEY) !== null || localStorage.getItem(LEGACY_BLOB_KEY) !== null;
  } catch {
    return false;
  }
}

export function destroyVault(): void {
  try {
    // Both names, or "delete and start over" would leave the pre-rename blob
    // behind and the vault would still be there on the next look.
    localStorage.removeItem(BLOB_KEY);
    localStorage.removeItem(LEGACY_BLOB_KEY);
  } catch {
    /* nothing to remove */
  }
}

// Backed by a plain ArrayBuffer rather than the ArrayBufferLike that
// Uint8Array.from infers — Web Crypto's types won't take a possibly-shared one.
type Bytes = Uint8Array<ArrayBuffer>;

function toBase64(bytes: Bytes): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Bytes {
  const binary = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveKey(password: string, salt: Bytes): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function readBlob(): VaultBlob | null {
  try {
    const raw = localStorage.getItem(BLOB_KEY) ?? localStorage.getItem(LEGACY_BLOB_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<VaultBlob>;
    if (typeof parsed?.salt !== 'string' || typeof parsed.iv !== 'string' || typeof parsed.data !== 'string') {
      return null;
    }
    return { v: 1, salt: parsed.salt, iv: parsed.iv, data: parsed.data };
  } catch {
    return null;
  }
}

async function writeItems(key: CryptoKey, salt: Bytes, items: Item[]): Promise<void> {
  // A fresh nonce per write: reusing one under the same key would leak.
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify({ version: 1, items }));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  const blob: VaultBlob = {
    v: 1,
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(data)),
  };
  localStorage.setItem(BLOB_KEY, JSON.stringify(blob));
}

/** An open vault: the in-memory key plus the notes it just decrypted. */
export interface OpenVault {
  items: Item[];
  storage: NotebookStorage;
}

export type UnlockResult =
  | { ok: true; vault: OpenVault }
  | { ok: false; reason: 'wrong-password' | 'unsupported' | 'missing' };

function makeStorage(key: CryptoKey, salt: Bytes, initial: Item[]): NotebookStorage {
  // The notebook holds the current items; this mirror lets a failed write fall
  // back to something valid rather than nothing.
  let latest = initial;
  return {
    load: () => latest,
    save: (items) => {
      latest = items;
      // Writing is async, and callers are synchronous — failures are swallowed
      // the same way a full localStorage is in the everyday notebook.
      void writeItems(key, salt, items).catch(() => undefined);
    },
  };
}

/** Create the vault for the first time. */
export async function createVault(password: string): Promise<UnlockResult> {
  if (!cryptoAvailable()) return { ok: false, reason: 'unsupported' };
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);
  await writeItems(key, salt, []);
  return { ok: true, vault: { items: [], storage: makeStorage(key, salt, []) } };
}

/** Open an existing vault, or report why not. */
export async function unlockVault(password: string): Promise<UnlockResult> {
  if (!cryptoAvailable()) return { ok: false, reason: 'unsupported' };
  const blob = readBlob();
  if (!blob) return { ok: false, reason: 'missing' };

  const salt = fromBase64(blob.salt);
  const key = await deriveKey(password, salt);
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(blob.iv) },
      key,
      fromBase64(blob.data),
    );
    // AES-GCM authenticates, so a wrong password fails here rather than
    // returning plausible garbage.
    const items = parseImport(new TextDecoder().decode(plaintext)) ?? [];
    return { ok: true, vault: { items, storage: makeStorage(key, salt, items) } };
  } catch {
    return { ok: false, reason: 'wrong-password' };
  }
}
