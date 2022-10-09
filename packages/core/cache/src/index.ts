import { CacheOptions, caching, CachingConfig, multiCaching, StoreConfig, WrapArgsType } from 'cache-manager';

/**
 * be used for create cache {@link createCache}
 */
export type ICacheConfig = StoreConfig &
  CacheOptions & {
    // every storeConfig init a store instance
    storePackage?: string;
  };

/**
 * create a default cache config object
 * @returns {ICacheConfig}
 */
export function createDefaultCacheConfig(): ICacheConfig {
  return {
    ttl: 86400, // seconds
    max: 1000,
    store: 'memory',
  };
}

/**
 * cache and multi cache common method and only keep promise method
 */
export interface Cache {
  set<T>(key: string, value: T, options?: CachingConfig): Promise<T>;

  set<T>(key: string, value: T, ttl: number): Promise<T>;

  wrap<T>(...args: WrapArgsType<T>[]): Promise<T>;

  get<T>(key: string): Promise<T | undefined>;

  del(key: string): Promise<any>;

  reset(): Promise<void>;
}

/**
 * create cache
 * <br/> if cacheConfig is array and length gt 1 then will be return multi cache, else will be return cache
 * @param {ICacheConfig | ICacheConfig[]} cacheConfig
 * @returns {Cache}
 */
export function createCache(cacheConfig: ICacheConfig | ICacheConfig[] = createDefaultCacheConfig()): Cache {
  if (Array.isArray(cacheConfig)) {
    // multi cache
    if (cacheConfig.length === 1) {
      return createCacheByICacheConfig(cacheConfig[0]);
    } else {
      let caches = [];
      for (const cacheConfigEle of cacheConfig) {
        caches.push(createCacheByICacheConfig(cacheConfigEle));
      }
      return multiCaching(caches) as Cache;
    }
  } else {
    return createCacheByICacheConfig(cacheConfig);
  }
}

function createCacheByICacheConfig(cacheConfig: ICacheConfig): Cache {
  // if storePackage exist then load storePackage and instead store
  if (cacheConfig.storePackage) {
    cacheConfig.store = require(cacheConfig.storePackage);
  }
  return caching(cacheConfig);
}
