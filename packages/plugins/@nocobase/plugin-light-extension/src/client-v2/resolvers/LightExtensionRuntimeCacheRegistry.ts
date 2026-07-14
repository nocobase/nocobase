/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type LightExtensionRuntimeCacheInvalidator = {
  invalidateRepo(repoId: string): void;
  clear(): void;
};

const runtimeCaches = new WeakMap<object, LightExtensionRuntimeCacheInvalidator>();

export function getOrCreateLightExtensionRuntimeCache<TCache extends LightExtensionRuntimeCacheInvalidator>(
  api: object,
  create: () => TCache,
): TCache {
  const existing = runtimeCaches.get(api);
  if (existing) {
    return existing as TCache;
  }
  const cache = create();
  runtimeCaches.set(api, cache);
  return cache;
}

export function invalidateLightExtensionRuntimeCache(api: object, repoId?: string): void {
  const cache = runtimeCaches.get(api);
  if (!cache) {
    return;
  }
  if (repoId) {
    cache.invalidateRepo(repoId);
    return;
  }
  cache.clear();
}
