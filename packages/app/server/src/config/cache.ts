import { createDefaultCacheConfig } from '@nocobase/cache';

const cacheConfig = !!process.env.CACHE_CONFIG ? JSON.parse(process.env.CACHE_CONFIG) : createDefaultCacheConfig();

export default cacheConfig;
