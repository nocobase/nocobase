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
