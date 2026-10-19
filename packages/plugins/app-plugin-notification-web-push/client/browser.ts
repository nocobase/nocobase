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
export function registerWorker(
  base: string,
): Promise<ServiceWorkerRegistration> {
  base = pushBase(base);
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
