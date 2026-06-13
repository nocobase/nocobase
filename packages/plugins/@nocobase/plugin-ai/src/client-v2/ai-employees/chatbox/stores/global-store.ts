/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type GlobalWithAIChatStores = typeof globalThis & {
  __nocobasePluginAIChatStores?: Record<string, unknown>;
};

export const getOrCreateGlobalStore = <T>(key: string, createStore: () => T): T => {
  const global = globalThis as GlobalWithAIChatStores;
  const stores = global.__nocobasePluginAIChatStores ?? {};
  global.__nocobasePluginAIChatStores = stores;

  const existingStore = stores[key];
  if (existingStore) {
    return existingStore as T;
  }

  const store = createStore();
  stores[key] = store;
  return store;
};
