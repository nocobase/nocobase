import { Config, FactoryStore, MemoryConfig, Store, caching } from 'cache-manager';
import { Cache } from './cache';
import { redisStore } from 'cache-manager-redis-yet';
import { RedisClientOptions } from 'redis';
import lodash from 'lodash';

export type AppCacheOptions = {
  default?: 'memory' | 'redis';
  memory?: MemoryConfig;
  redis?: RedisClientOptions & Config;
};

export class CacheManager {
  private stores = new Map<string, 'memory' | FactoryStore<Store, any>>();
  private caches = new Map<string, Cache>();

  async init(options: AppCacheOptions) {
    await this.register('memory', 'memory');
    await this.create('memory', 'memory', options.memory);
    if (options.redis) {
      await this.register('redis', redisStore);
      await this.create('redis', 'redis', options.redis);
    }
  }

  // Register a new store factory and create a default cache
  async register(name: string, store: 'memory' | FactoryStore<Store, any>, defaultConfig?: any) {
    this.stores.set(name, store);
    const space = await caching(store as any, defaultConfig);
    const cache = new Cache({ namespace: name, cache: space });
    this.caches.set(name, cache);
    return store;
  }

  // Create a new cache with the name of store factory and custom config
  async create(namespace: string, storeName: string, options?: any): Promise<Cache> {
    const store = this.stores.get(storeName) as any;
    if (!store) {
      throw new Error(`Create cache failed, store is unavailable or not registered`);
    }
    if (lodash.isEmpty(options)) {
      // Use the default cache if the options is empty
      const cache = this.caches.get(storeName);
      if (cache) {
        return cache;
      }
    }
    const space = await caching(store, options);
    const cache = new Cache({ namespace, cache: space });
    this.caches.set(namespace, cache);
    return cache;
  }

  get(namespace: string): Cache {
    const cache = this.caches.get(namespace);
    if (!cache) {
      throw new Error(`Get cache failed, ${namespace} is not found`);
    }
    return cache;
  }
}
