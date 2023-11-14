import { FactoryStore, Store, caching, Cache as BasicCache } from 'cache-manager';
import { Cache } from './cache';
import lodash from 'lodash';

type StoreType = {
  store: 'memory' | FactoryStore<Store, any>;
  globalConfig?: any;
};

export class CacheManager {
  defaultStore: string;
  private stores = new Map<string, BasicCache>();
  storeTypes = new Map<string, StoreType>();
  caches = new Map<string, Cache>();

  constructor(options?: { defaultStore: string }) {
    const { defaultStore = 'memory' } = options || {};
    this.defaultStore = defaultStore;
  }

  private async createStore(options: { name: string; storeType: string; [key: string]: any }) {
    const { name, storeType: type, ...config } = options;
    const storeType = this.storeTypes.get(type) as any;
    if (!storeType) {
      throw new Error(`Create cache failed, store type [${type}] is unavailable or not registered`);
    }
    const { store: s, globalConfig } = storeType;
    const store = await caching(s, { ...globalConfig, ...config });
    this.stores.set(name, store);
    return store;
  }

  registerStore(options: { name: string; store: 'memory' | FactoryStore<Store, any>; [key: string]: any }) {
    const { name, store, ...globalConfig } = options;
    this.storeTypes.set(name, { store, globalConfig });
  }

  private newCache(options: { name: string; prefix?: string; store: BasicCache }) {
    const { name, prefix, store } = options;
    const cache = new Cache({ name, prefix, store });
    this.caches.set(name, cache);
    return cache;
  }

  async createCache(options: { name: string; prefix?: string; store?: string; [key: string]: any }) {
    const { name, prefix, store = this.defaultStore, ...config } = options;
    if (!lodash.isEmpty(config)) {
      const newStore = await this.createStore({ name, storeType: store, ...config });
      return this.newCache({ name, prefix, store: newStore });
    }
    const s = this.stores.get(store);
    if (!s) {
      const defaultStore = await this.createStore({ name: store, storeType: store });
      return this.newCache({ name, prefix, store: defaultStore });
    }
    return this.newCache({ name, prefix, store: s });
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
