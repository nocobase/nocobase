import { Cache, CacheOptions, caching, StoreConfig } from 'cache-manager';

/**
 * be used for create cache {@link createCache}
 */
export type ICacheConfig = StoreConfig &
  CacheOptions & {
    storePackage?: string;
  };

/**
 * create a default cache config object
 * @returns {ICacheConfig}
 */
export function createDefaultCacheConfig(): ICacheConfig {
  return {
    ttl: 3600, // seconds
    max: 100,
    store: 'memory',
  };
}

export { Cache } from 'cache-manager';

/**
 * create cache
 * @param {ICacheConfig} cacheConfig
 * @returns {Cache}
 */
export function createCache(cacheConfig: ICacheConfig = createDefaultCacheConfig()): Cache {
  // if storePackage exist then load storePackage and instead store
  if (!!cacheConfig.storePackage) {
    cacheConfig.store = require(cacheConfig.storePackage);
  }
  return caching(cacheConfig);
}
