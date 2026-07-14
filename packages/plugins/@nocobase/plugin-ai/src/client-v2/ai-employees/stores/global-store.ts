/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type GlobalWithPluginAIStores = typeof globalThis & {
  __nocobasePluginAIStores?: Record<string, unknown>;
};

export const getOrCreateGlobalStore = <T>(key: string, createStore: () => T): T => {
  const global = globalThis as GlobalWithPluginAIStores;
  const stores = global.__nocobasePluginAIStores ?? {};
  global.__nocobasePluginAIStores = stores;

  if (Object.prototype.hasOwnProperty.call(stores, key)) {
    return stores[key] as T;
  }

  const store = createStore();
  stores[key] = store;
  return store;
};
