/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FactoryStore, Store, caching, Cache as BasicCache } from 'cache-manager';
import { Cache } from './cache';
import lodash from 'lodash';
import { RedisStore, redisStore } from 'cache-manager-redis-yet';
import deepmerge from 'deepmerge';
import { MemoryBloomFilter } from './bloom-filter/memory-bloom-filter';
import { BloomFilter } from './bloom-filter';
import { RedisBloomFilter } from './bloom-filter/redis-bloom-filter';

type StoreOptions = {
  store?: 'memory' | FactoryStore<Store, any>;
  close?: (store: Store) => Promise<void>;
  // global config
  [key: string]: any;
};

export type CacheManagerOptions = Partial<{
  defaultStore: string;
  stores: {
    [storeType: string]: StoreOptions;
  };
}>;

export class CacheManager {
  defaultStore: string;
  private stores = new Map<
    string,
    {
      store: BasicCache;
      close?: (store: Store) => Promise<void>;
    }
  >();
  /**
   * @internal
   */
  storeTypes = new Map<string, StoreOptions>();
  /**
   * @internal
   */
  caches = new Map<string, Cache>();

  constructor(options?: CacheManagerOptions) {
    const defaultOptions: CacheManagerOptions = {
      defaultStore: 'memory',
      stores: {
        memory: {
          store: 'memory',
          // global config
          max: 2000,
        },
        redis: {
          store: redisStore,
          close: async (redis: RedisStore) => {
            if (!redis.client?.isOpen) {
              return;
            }
            await redis.client.quit();
          },
        },
      },
    };
    const cacheOptions = deepmerge(defaultOptions, options || {});
    const { defaultStore = 'memory', stores } = cacheOptions;
    this.defaultStore = defaultStore;
    for (const [name, store] of Object.entries(stores)) {
      const { store: s, ...globalConfig } = store;
      this.registerStore({ name, store: s, ...globalConfig });
    }
  }

  private async createStore(options: { name: string; storeType: string; [key: string]: any }) {
    const { name, storeType: type, ...config } = options;
    const storeType = this.storeTypes.get(type) as any;
    if (!storeType) {
      throw new Error(`Create cache failed, store type [${type}] is unavailable or not registered`);
    }
    const { store: s, close, ...globalConfig } = storeType;
    const store = await caching(s, { ...globalConfig, ...config });
    this.stores.set(name, { close, store });
    return store;
  }

  registerStore(options: { name: string } & StoreOptions) {
    const { name, ...rest } = options;
    this.storeTypes.set(name, rest);
  }

  private newCache(options: { name: string; prefix?: string; store: BasicCache }) {
    const { name, prefix, store } = options;
    const cache = new Cache({ name, prefix, store });
    this.caches.set(name, cache);
    return cache;
  }

  async createCache(options: { name: string; prefix?: string; store?: string; [key: string]: any }) {
    const { name, prefix, store = this.defaultStore, ...config } = options;
    if (!lodash.isEmpty(config) || store === 'memory') {
      const newStore = await this.createStore({ name, storeType: store, ...config });
      return this.newCache({ name, prefix, store: newStore });
    }
    const s = this.stores.get(store);
    if (!s) {
      const defaultStore = await this.createStore({ name: store, storeType: store });
      return this.newCache({ name, prefix, store: defaultStore });
    }
    return this.newCache({ name, prefix, store: s.store });
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

  async close() {
    const promises = [];
    for (const s of this.stores.values()) {
      const { close, store } = s;
      close && promises.push(close(store.store));
    }
    await Promise.all(promises);
  }

  /**
   * @experimental
   */
  async createBloomFilter(options?: { store?: string }): Promise<BloomFilter> {
    const name = 'bloom-filter';
    const { store = this.defaultStore } = options || {};
    let cache: Cache;
    try {
      cache = this.getCache(name);
    } catch (error) {
      cache = await this.createCache({ name, store });
    }
    switch (store) {
      case 'memory':
        return new MemoryBloomFilter(cache);
      case 'redis':
        return new RedisBloomFilter(cache);
      default:
        throw new Error(`BloomFilter store [${store}] is not supported`);
    }
  }
}
