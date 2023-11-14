import { AppCacheManagerOptions } from '@nocobase/cache';

export const cacheManager = {
  defaultStore: process.env.CACHE_DEFAULT_STORE || 'memory',
  stores: {
    memory: {
      store: 'memory',
      max: parseInt(process.env.CACHE_MEMORY_MAX) || 2000,
    },
  },
} as AppCacheManagerOptions;
