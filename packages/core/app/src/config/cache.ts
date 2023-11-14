import { AppCacheOptions } from '@nocobase/cache';

export default {
  defaultStoreType: process.env.CACHE_DEFAULT_STORE_TYPE || 'memory',
  storesTypes: {
    memory: {
      store: 'memory',
      max: parseInt(process.env.CACHE_MEMORY_MAX) || 2000,
    },
  },
} as AppCacheOptions;
