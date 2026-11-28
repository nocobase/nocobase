import type { ApiClient } from '@nocobase/app-client';

export interface PushDevice {
  id: string;
  name: string;
  locale: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}
export const pushBase = (base: string): string =>
  `${base.replace(/\/+$/u, '')}/`;
export const deviceKey = (base: string, userId: string): string =>
  `nocobase:push:${pushBase(base)}:${userId}`;
export function currentDevice(base: string, userId: string): string | null {
  try {
    return localStorage.getItem(deviceKey(base, userId));
  } catch {
    return null;
  }
}
export function rememberDevice(
  base: string,
  userId: string,
  id: string | null,
): void {
  try {
    if (id) localStorage.setItem(deviceKey(base, userId), id);
    else localStorage.removeItem(deviceKey(base, userId));
  } catch {
    /* Preferences still work when browser storage is unavailable. */
  }
  window.dispatchEvent(new Event('nocobase:push-device'));
}
const listening = new WeakSet<ServiceWorkerContainer>();
/** Opens a clicked notification's target in a window the worker could not navigate itself. */
function listenForNavigation(container: ServiceWorkerContainer): void {
  if (listening.has(container)) return;
  listening.add(container);
  container.addEventListener('message', (event) => {
    const data = event.data as { kind?: unknown; url?: unknown } | null;
    if (data?.kind !== 'webPush.navigate' || typeof data.url !== 'string')
      return;
    const url = new URL(data.url, window.location.href);
    if (url.origin === window.location.origin) window.location.assign(url.href);
  });
}
export function registerWorker(
  base: string,
): Promise<ServiceWorkerRegistration> {
  base = pushBase(base);
  listenForNavigation(navigator.serviceWorker);
  return navigator.serviceWorker.register(`${base}push-worker.js`, {
    scope: base,
    updateViaCache: 'none',
  });
}
export async function unsubscribeDevice(
  api: Pick<ApiClient, 'request'>,
  base: string,
  userId: string,
): Promise<void> {
  const id = currentDevice(base, userId);
  if (id)
    await api.request({
      method: 'DELETE',
      path: `webPush/subscriptions/${encodeURIComponent(id)}`,
    });
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration(
      pushBase(base),
    );
    await (await registration?.pushManager?.getSubscription())?.unsubscribe();
    registration?.active?.postMessage({
      kind: 'webPush.logout',
    });
    for (const notification of (await registration?.getNotifications?.()) ?? [])
      notification.close();
  }
  rememberDevice(base, userId, null);
}

/**
 * Records a badge version in the store the push worker uses, and answers whether it is not older than the newest a
 * page or push applied. Without IndexedDB nothing is compared.
 */
function newestBadge(base: string, version: number): Promise<boolean> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(true);
  return new Promise((resolve) => {
    const opening = indexedDB.open(`nocobase:push-badge:${pushBase(base)}`, 1);
    opening.onupgradeneeded = () =>
      opening.result.createObjectStore('state', { keyPath: 'id' });
    opening.onerror = () => resolve(true);
    opening.onsuccess = () => {
      const db = opening.result;
      let apply = true;
      const tx = db.transaction('state', 'readwrite');
      const store = tx.objectStore('state');
      const request = store.get('badge');
      request.onsuccess = () => {
        const stored = request.result as { version?: number } | undefined;
        if ((stored?.version ?? -1) > version) apply = false;
        else store.put({ id: 'badge', version });
      };
      tx.oncomplete =
        tx.onerror =
        tx.onabort =
          () => {
            db.close();
            resolve(apply);
          };
    };
  });
}

/**
 * Shows a count on the installed app's icon, or clears it at zero. With a `version` (the server's
 * `nextBadgeVersion()`, taken before the count was read), a count older than the newest one a page or the push worker
 * applied is ignored, so pages and late pushes cannot overwrite a newer count with an older one. Without a version,
 * such as on signing out, it applies unconditionally. Resolves whether it applied; browsers without badging ignore it.
 */
export async function setAppBadge(
  base: string,
  count: number,
  version?: number,
): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('setAppBadge' in navigator))
    return false;
  if (version !== undefined && !(await newestBadge(base, version)))
    return false;
  await (
    count > 0 ? navigator.setAppBadge(count) : navigator.clearAppBadge()
  ).catch(() => undefined);
  return true;
}
