import { createDefaultCacheConfig, ICacheConfig } from '@nocobase/cache';

const defaultCacheConfig = createDefaultCacheConfig();

export default {
  max: !!process.env.CACHE_MAX ? parseInt(process.env.CACHE_MAX) : defaultCacheConfig.max,
  store: !!process.env.CACHE_STORE ? process.env.CACHE_STORE : defaultCacheConfig.store,
  storePackage: process.env.CACHE_STORE_PACKAGE,
  storeConfig: !!process.env.CACHE_STORE_CONFIG ? JSON.parse(process.env.CACHE_STORE_CONFIG) : {},
  ttl: !!process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL) : defaultCacheConfig.ttl,
} as ICacheConfig;
