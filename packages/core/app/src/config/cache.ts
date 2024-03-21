import { CacheManagerOptions } from '@nocobase/cache';

export const cacheManager = {
  defaultStore: process.env.CACHE_DEFAULT_STORE || 'memory',
  stores: {
    memory: {
      store: 'memory',
      max: parseInt(process.env.CACHE_MEMORY_MAX) || 2000,
    },
    ...(process.env.CACHE_REDIS_URL
      ? {
          redis: {
            url: process.env.CACHE_REDIS_URL,
          },
        }
      : {}),
  },
} as CacheManagerOptions;
