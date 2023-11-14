import { AppCacheOptions, CacheManager } from '@nocobase/cache';
import Application from '../application';

export const createCacheManager = async (app: Application, options: AppCacheOptions) => {
  const {
    defaultStore,
    stores = {
      memory: {
        store: 'memory',
      },
    },
  } = options || {};
  const cacheManager = new CacheManager({ defaultStore });
  for (const [name, storeType] of Object.entries(stores)) {
    const { store, ...globalConfig } = storeType;
    await cacheManager.registerStore({ name, store, ...globalConfig });
  }
  const defaultCache = await cacheManager.createCache({ name: app.name });
  app.cache = defaultCache;
  app.context.cache = defaultCache;
  return cacheManager;
};
