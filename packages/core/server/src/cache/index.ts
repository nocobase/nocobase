import { AppCacheOptions, CacheManager } from '@nocobase/cache';
import Application from '../application';

export const createCacheManager = async (app: Application, options: AppCacheOptions) => {
  const { defaultStoreType, storesTypes = {} } = options || {};
  const cacheManager = new CacheManager({ defaultStoreType });
  Object.entries(storesTypes).forEach(([name, storeType]) => {
    const { store, ...globalConfig } = storeType;
    cacheManager.registerStore({ name, store, ...globalConfig });
  });
  const defaultCache = await cacheManager.createCache({ name: app.name });
  app.cache = defaultCache;
  app.context.cache = defaultCache;
  return cacheManager;
};
