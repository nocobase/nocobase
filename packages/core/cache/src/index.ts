import { FactoryStore, Store } from 'cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import deepmerge from 'deepmerge';
import { CacheManager } from './cache-manager';

export * from './cache-manager';
export * from './cache';

export type AppCacheManagerOptions = Partial<{
  defaultStore: string;
  stores: {
    [storeType: string]: {
      store: 'memory' | FactoryStore<Store, any>;
      // global config
      [key: string]: any;
    };
  };
}>;

export const newAppCacheManager = (options: AppCacheManagerOptions) => {
  const defaultOptions: AppCacheManagerOptions = {
    defaultStore: 'memory',
    stores: {
      memory: {
        store: 'memory',
        // global config
        max: 2000,
      },
      redis: {
        store: redisStore,
      },
    },
  };
  const cacheOptions = deepmerge(defaultOptions, options);
  const { defaultStore, stores } = cacheOptions;
  const cacheManager = new CacheManager({ defaultStore });
  for (const [name, store] of Object.entries(stores)) {
    const { store: s, ...globalConfig } = store;
    cacheManager.registerStore({ name, store: s, ...globalConfig });
  }
  return cacheManager;
};
