/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useSyncExternalStore } from 'react';

export type CurrentUserAuthStatus = 'unknown' | 'authenticated' | 'unauthenticated' | 'redirecting';

type AuthStatusStore = {
  getSnapshot: () => CurrentUserAuthStatus;
  set: (status: CurrentUserAuthStatus) => void;
  subscribe: (listener: () => void) => () => void;
};

const stores = new WeakMap<object, AuthStatusStore>();

function createAuthStatusStore(): AuthStatusStore {
  let status: CurrentUserAuthStatus = 'unknown';
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => status,
    set: (nextStatus) => {
      if (status === nextStatus) {
        return;
      }
      status = nextStatus;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function getAuthStatusStore(app: object) {
  let store = stores.get(app);
  if (!store) {
    store = createAuthStatusStore();
    stores.set(app, store);
  }
  return store;
}

export function setCurrentUserAuthStatus(app: object, status: CurrentUserAuthStatus) {
  getAuthStatusStore(app).set(status);
}

export function useCurrentUserAuthStatus(app: object) {
  const store = getAuthStatusStore(app);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
