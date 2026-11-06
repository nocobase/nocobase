import type { ApiClient } from '@nocobase/app-client';

import type { DemoSignInAccount } from '../shared/accounts.js';

interface DemoAccountCache {
  readonly snapshot: () => readonly DemoSignInAccount[] | null;
  readonly subscribe: (listener: () => void) => () => void;
  readonly load: (refresh?: boolean) => Promise<void>;
}

// The host owns one API client per application. Cache neither accounts nor requests across hosts.
const caches = new WeakMap<ApiClient, DemoAccountCache>();

export function demoAccountCache(api: ApiClient): DemoAccountCache {
  const existing = caches.get(api);
  if (existing) return existing;
  let accounts: readonly DemoSignInAccount[] | null = null;
  let loaded = false;
  let pending: Promise<void> | undefined;
  let refreshQueued = false;
  const listeners = new Set<() => void>();
  const cache: DemoAccountCache = {
    snapshot: () => accounts,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    load: (refresh = false) => {
      if (pending) {
        refreshQueued ||= refresh;
        return pending;
      }
      if (loaded && !refresh) return Promise.resolve();
      pending = (async () => {
        do {
          refreshQueued = false;
          try {
            const { data } = await api.request<{ data: DemoSignInAccount[] }>({
              path: '/demoMode/accounts',
            });
            accounts = data;
            loaded = true;
          } catch {
            // Keep a usable list on refresh failure; an initial failure can retry on the next mount.
            accounts ??= [];
          }
          for (const listener of listeners) listener();
          // A data operation may finish while an older list request is still in flight.
        } while (refreshQueued);
      })().finally(() => {
        pending = undefined;
      });
      return pending;
    },
  };
  caches.set(api, cache);
  return cache;
}
