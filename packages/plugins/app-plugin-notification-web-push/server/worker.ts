import {
  defineRootRoutes,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { Hono } from 'hono';
export interface PushWorkerOptions {
  title?: string;
  icon?: string;
}
export function workerSource(input: PushWorkerOptions = {}): string {
  const options = {
    title: input.title ?? 'Notification',
    icon: input.icon,
  };
  return (
    `const options = ${JSON.stringify(options)};\n` +
    `/* global self: readonly, indexedDB: readonly, URL: readonly */
/* No fetch handler: this worker owns notifications, never offline page caching. */
self.addEventListener('install', (event) =>
  event.waitUntil(self.skipWaiting()),
);
self.addEventListener('activate', (event) =>
  event.waitUntil(self.clients.claim()),
);

function target(path) {
  const scope = new URL(self.registration.scope);
  const url = new URL(path || scope.href, scope);
  return url.origin === scope.origin && url.pathname.startsWith(scope.pathname)
    ? url.href
    : scope.href;
}

function record(data) {
  return new Promise((resolve) => {
    const base = new URL(self.registration.scope).pathname;
    const opening = indexedDB.open(\`nocobase:push:\${base}\`, 1);
    opening.onupgradeneeded = () =>
      opening.result.createObjectStore('events', { keyPath: 'id' });
    opening.onerror = () => resolve();
    opening.onsuccess = () => {
      const db = opening.result;
      const tx = db.transaction('events', 'readwrite');
      const store = tx.objectStore('events');
      store.put({
        id: String(data.dedupeKey),
        at: Date.now(),
      });
      const request = store.getAll();
      request.onsuccess = () => {
        for (const old of request.result.sort((a, b) => b.at - a.at).slice(512))
          store.delete(old.id);
      };
      tx.oncomplete = tx.onerror = () => {
        db.close();
        resolve();
      };
    };
  });
}

/**
 * Records the badge's version and answers whether it is not older than the newest a push or page applied. Pages write
 * the same record through setAppBadge() in the client, so a count a page set also outranks an older push.
 */
function newest(data) {
  const version = data.badgeVersion;
  const scope = data.badgeScope;
  if (!Number.isSafeInteger(version) || version < 0 || typeof scope !== 'string' ||
      typeof indexedDB === 'undefined') return Promise.resolve(false);
  return new Promise((resolve) => {
    const base = new URL(self.registration.scope).pathname;
    const opening = indexedDB.open(\`nocobase:push-badge-v2:\${base}\`, 1);
    opening.onupgradeneeded = () =>
      opening.result.createObjectStore('state', { keyPath: 'id' });
    opening.onerror = () => resolve(false);
    opening.onsuccess = () => {
      const db = opening.result;
      let apply = true;
      const tx = db.transaction('state', 'readwrite');
      const store = tx.objectStore('state');
      const request = store.get('badge');
      request.onsuccess = () => {
        if (request.result && (request.result.scope !== scope || request.result.version > version)) apply = false;
        else store.put({ id: 'badge', version, scope });
      };
      tx.oncomplete = () => {
        db.close();
        resolve(apply);
      };
      tx.onerror = tx.onabort = () => {
        db.close();
        resolve(false);
      };
    };
  });
}

self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      let data = {};
      try {
        data = event.data?.json() ?? {};
      } catch {
        /* Display a safe fallback. */
      }
      if (data.dedupeKey) await record(data);
      // The installed app's icon badge follows the newest count the server read; browsers without badging ignore it.
      if (Number.isSafeInteger(data.badge) && data.badge >= 0 && (await newest(data))) {
        await (data.badge > 0
          ? self.navigator?.setAppBadge?.(data.badge)
          : self.navigator?.clearAppBadge?.()
        )?.catch(() => undefined);
        // An open page reads the count again and sets it, since a page may have read a newer count than this push.
        for (const client of await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        }))
          client.postMessage({ kind: 'webPush.badge' });
      }
      // WebKit requires a user-visible notification for every Push, including a foreground race.
      await self.registration.showNotification(String(data.title || options.title), {
        tag: String(data.dedupeKey || 'web-push'),
        body: String(data.body || ''),
        ...(options.icon ? { icon: new URL(options.icon, self.registration.scope).href } : {}),
        data: { url: target(data.url) },
      });
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const url = target(event.notification.data?.url);
      const windows = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      const scope = self.registration.scope;
      const existing = windows.find((client) => client.url.startsWith(scope));
      if (!existing) {
        await self.clients.openWindow(url);
        return;
      }
      // Focus first: the click's permission to focus can expire while a slow navigation loads.
      await existing.focus().catch(() => undefined);
      try {
        await existing.navigate(url);
      } catch {
        // Only a window this worker controls can be navigated; a page loaded before it or by a forced reload is not.
        existing.postMessage({ kind: 'webPush.navigate', url });
      }
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.kind === 'webPush.logout')
    event.waitUntil(
      (async () => {
        await (
          await self.registration.pushManager.getSubscription()
        )?.unsubscribe();
        for (const notification of await self.registration.getNotifications())
          notification.close();
      })(),
    );
});
`
  );
}
export function createWorkerRoutes(
  options: PushWorkerOptions = {},
): AppRouteContribution<AppPluginApplication> {
  return defineRootRoutes<AppPluginApplication>(() => {
    const router = new Hono();
    router.get('/push-worker.js', (context) => {
      context.header('Content-Type', 'application/javascript; charset=utf-8');
      context.header('Cache-Control', 'no-cache');
      return context.body(workerSource(options));
    });
    return router;
  });
}
