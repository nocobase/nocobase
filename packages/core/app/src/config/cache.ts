/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
