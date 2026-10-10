/**
 * The inbox sound reminder: a short two-note chime when the number of decisions
 * waiting on the viewer goes up, synthesised with Web Audio so there is no asset to ship.
 *
 * Whether it plays is the person's preference `inbox.chime` (default on), kept on the server with their account
 * (`useUserPreference`); a choice this browser kept before (`studio.inbox.chime` in `localStorage`) moves
 * there once. Browsers keep audio suspended until the page has had a user gesture: `armInboxChime` resumes it on the
 * first pointer or key press, and a chime before that is skipped silently. With several tabs open only one plays: the
 * tab that chimes holds a Web Lock for a few seconds.
 */
import { useUserPreference } from '@nocobase/app-plugin-users/client/preferences';

/** The preference key. */
export const INBOX_CHIME_PREFERENCE = 'inbox.chime';

const legacyStorageKey = 'studio.inbox.chime';
const lockName = 'studio-inbox-chime';
const lockHoldMs = 3000;

let context: AudioContext | null = null;
let armed = false;

const parseChime = (value: unknown): boolean | undefined =>
  typeof value === 'boolean' ? value : undefined;

function legacyChime(): boolean | undefined {
  try {
    const value = window.localStorage.getItem(legacyStorageKey);
    return value === 'off' ? false : value === 'on' ? true : undefined;
  } catch {
    return undefined;
  }
}

/** Whether the chime plays for the signed-in person, and how to change it. */
export function useInboxChime(): {
  readonly enabled: boolean;
  readonly setEnabled: (enabled: boolean) => void;
} {
  const [enabled, setEnabled] = useUserPreference(INBOX_CHIME_PREFERENCE, {
    defaultValue: true,
    parse: parseChime,
    legacy: legacyChime,
  });
  return { enabled, setEnabled };
}

function audioContext(): AudioContext | null {
  if (context) return context;
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  try {
    context = new AudioContext();
  } catch {
    return null;
  }
  return context;
}

function disarm(): void {
  window.removeEventListener('pointerdown', unlock, true);
  window.removeEventListener('keydown', unlock, true);
}

function unlock(): void {
  const ctx = audioContext();
  if (!ctx || ctx.state === 'running') {
    disarm();
    return;
  }
  void ctx.resume().then(
    () => {
      if (ctx.state === 'running') disarm();
    },
    () => undefined,
  );
}

/** Resumes the audio context on the first user gesture, so a later chime can play. Idempotent. */
export function armInboxChime(): void {
  if (armed || typeof window === 'undefined') return;
  armed = true;
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
}

function ring(ctx: AudioContext): void {
  const start = ctx.currentTime + 0.01;
  // E6 then A6: short, soft, and distinct from system sounds.
  for (const [frequency, offset] of [
    [1318.5, 0],
    [1760, 0.14],
  ]) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const at = start + offset;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.12, at + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.35);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(at);
    oscillator.stop(at + 0.4);
  }
}

/**
 * Plays the chime once. Skipped while audio is still locked or another tab has just played it. `preview` is for the
 * toggle: it runs inside the click, so it can resume the context itself and skips the lock.
 */
export function playInboxChime({
  preview = false,
}: { readonly preview?: boolean } = {}): void {
  if (preview) {
    const ctx = audioContext();
    void ctx
      ?.resume()
      .then(() => ring(ctx))
      .catch(() => undefined);
    return;
  }
  const ctx = context;
  if (ctx?.state !== 'running') return;
  const locks = typeof navigator === 'undefined' ? undefined : navigator.locks;
  if (!locks) {
    ring(ctx);
    return;
  }
  void locks
    .request(lockName, { ifAvailable: true }, async (lock) => {
      if (!lock) return;
      ring(ctx);
      await new Promise((resolve) => window.setTimeout(resolve, lockHoldMs));
    })
    .catch(() => undefined);
}
