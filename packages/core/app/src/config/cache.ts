/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CacheManagerOptions } from '@nocobase/cache';

const redisURL = process.env.REDIS_URL || process.env.CACHE_REDIS_URL;
export const cacheManager: CacheManagerOptions = {
  defaultStore: process.env.CACHE_DEFAULT_STORE || 'memory',
  stores: {
    memory: {
      store: 'memory',
      max: parseInt(process.env.CACHE_MEMORY_MAX) || 2000,
    },
    ...(redisURL
      ? {
          redis: {
            url: redisURL,
          },
        }
      : {}),
  },
};
