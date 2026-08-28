/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type GlobalSingletonStore = typeof globalThis & Record<symbol, unknown>;

function getSingletonKey(name: string) {
  return Symbol.for(`@nocobase/plugin-workflow/client-v2/${name}`);
}

export function getWorkflowSingleton<T>(name: string, factory: () => T): T {
  const key = getSingletonKey(name);
  const store = globalThis as GlobalSingletonStore;

  if (!(key in store)) {
    store[key] = factory();
  }

  return store[key] as T;
}
