import { loadSettings } from './settings';

/**
 * Telling you a timer finished.
 *
 * A system notification when the browser allows one, and a short chime either
 * way — the in-app banner is App's job, so a blocked or ignored permission
 * still leaves you told.
 */

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return notificationsSupported() ? Notification.permission : 'unsupported';
}

/**
 * Ask once, from a real user gesture (starting a timer). Never nags: a denied
 * permission is remembered by the browser and asking again does nothing.
 */
export async function ensurePermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function notifyTimerDone(title: string, body: string): void {
  if (loadSettings().chime) chime();
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  try {
    const notification = new Notification(title, { body, tag: `qwertzy-${title}-${body}` });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // Some browsers throw for notifications outside a service worker; the
    // chime and the in-app banner still land.
  }
}

/** Two short notes, synthesised — no audio file to ship or fail to load. */
function chime(): void {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const play = (at: number, frequency: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = frequency;
      // Fade each note out so it reads as a chime, not a beep cut short.
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.18, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.3);
    };
    play(ctx.currentTime, 880);
    play(ctx.currentTime + 0.22, 1174.7);
    window.setTimeout(() => ctx.close(), 1200);
  } catch {
    // Audio blocked before any gesture — nothing to recover from.
  }
}
