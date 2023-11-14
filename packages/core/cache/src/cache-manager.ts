import { FactoryStore, Store, caching, Cache as BasicCache } from 'cache-manager';
import { Cache } from './cache';
import lodash from 'lodash';

type StoreType = {
  store: 'memory' | FactoryStore<Store, any>;
  globalConfig?: any;
};

export type AppCacheOptions = {
  defaultStoreType?: string;
  storesTypes: {
    [name: string]: StoreType;
  };
};

export class CacheManager {
  defaultStoreType: string;
  private stores = new Map<string, BasicCache>();
  storeTypes = new Map<string, StoreType>();
  caches = new Map<string, Cache>();

  constructor(options?: { defaultStoreType: string }) {
    const { defaultStoreType = 'memory' } = options || {};
    this.defaultStoreType = defaultStoreType;
  }

  private async createStore(options: { name: string; storeType: string }) {
    const { name, storeType, ...config } = options;
    const { store: s, globalConfig } = this.storeTypes.get(storeType) as any;
    if (!s) {
      throw new Error(`Create cache failed, store type [${storeType}] is unavailable or not registered`);
    }
    const store = await caching(s, { ...globalConfig, ...config });
    this.stores.set(name, store);
    return store;
  }

  async registerStore(options: { name: string; store: 'memory' | FactoryStore<Store, any> }) {
    const { name, store, ...globalConfig } = options;
    this.storeTypes.set(name, { store, globalConfig });
    // create default store for the store type
    return await this.createStore({ name, storeType: name });
  }

  private async newCache(options: { name: string; prefix?: string; store: string }) {
    const { name, prefix, store: s, ...config } = options;
    const store = await this.createStore({ name, storeType: s, ...config });
    const cache = new Cache({ name, prefix, store });
    this.caches.set(name, cache);
    return cache;
  }

  createCache(options: { name: string; prefix?: string; store?: string; [key: string]: any }): Cache | Promise<Cache> {
    const { name, prefix, store = this.defaultStoreType, ...config } = options;
    if (!lodash.isEmpty(config)) {
      return this.newCache({ name, prefix, store, ...config });
    }
    const s = this.stores.get(store);
    if (!s) {
      return this.newCache({ name, prefix, store });
    }
    const cache = new Cache({ name, prefix, store: s });
    this.caches.set(name, cache);
    return cache;
  }

  getCache(name: string): Cache {
    const cache = this.caches.get(name);
    if (!cache) {
      throw new Error(`Get cache failed, ${name} is not found`);
    }
    return cache;
  }

  async flushAll() {
    const promises = [];
    for (const cache of this.caches.values()) {
      promises.push(cache.reset());
    }
    await Promise.all(promises);
  }
}
