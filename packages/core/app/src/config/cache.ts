import { AppCacheOptions } from '@nocobase/cache';

export default {
  default: process.env.CACHE_DEFAULT,
  memory: {
    ttl: parseInt(process.env.CACHE_MEMORY_TTL),
    max: parseInt(process.env.CACHE_MEMORY_MAX),
  },
  ...(process.env.CACHE_REDIS_URL
    ? {
        redis: {
          url: process.env.CACHE_REDIS_URL,
        },
      }
    : {}),
} as AppCacheOptions;
