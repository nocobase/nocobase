import { AppCacheOptions, CacheManager } from '@nocobase/cache';
import Application from '../application';

export const createCacheManager = async (app: Application, options: AppCacheOptions) => {
  const { defaultStoreType, storesTypes = {} } = options || {};
  const cacheManager = new CacheManager({ defaultStoreType });
  for (const [name, storeType] of Object.entries(storesTypes)) {
    const { store, ...globalConfig } = storeType;
    await cacheManager.registerStore({ name, store, ...globalConfig });
  }
  const defaultCache = await cacheManager.createCache({ name: app.name });
  app.cache = defaultCache;
  app.context.cache = defaultCache;
  return cacheManager;
};
