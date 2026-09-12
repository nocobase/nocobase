/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type ModuleImportor<TModule extends Record<string, any> = Record<string, any>> = () => Promise<TModule>;

type LazyCacheRecord<TModule extends Record<string, any> = Record<string, any>> = {
  error?: unknown;
  module?: TModule;
  promise?: Promise<TModule>;
};

const useLazyCache = new Map<string, LazyCacheRecord>();

export function useLazy<T = () => any>(importor: ModuleImportor, picker: string | ((module: any) => T)): T {
  const exportPicker = typeof picker === 'function' ? picker : (module) => module[picker];
  const cacheKey = importor.toString();
  const cached = useLazyCache.get(cacheKey);

  if (cached?.error) {
    throw cached.error;
  }

  if (cached?.module) {
    return exportPicker(cached.module) as T;
  }

  if (!cached?.promise) {
    const record: LazyCacheRecord = cached || {};
    record.promise = importor()
      .then((module) => {
        record.module = module;
        return module;
      })
      .catch((error) => {
        record.error = error;
        throw error;
      });
    useLazyCache.set(cacheKey, record);
    throw record.promise;
  }

  throw cached.promise;
}
