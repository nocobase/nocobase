import { AppCacheOptions } from '@nocobase/cache';

export default {
  default: process.env.CACHE_DEFAULT_STORE || 'memory',
  memory: {
    max: parseInt(process.env.CACHE_MEMORY_MAX) || 2000,
  },
  ...(process.env.CACHE_REDIS_URL
    ? {
        redis: {
          url: process.env.CACHE_REDIS_URL,
        },
      }
    : {}),
} as AppCacheOptions;
