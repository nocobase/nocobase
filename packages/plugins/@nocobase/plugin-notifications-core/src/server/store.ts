/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Cache, CacheManager } from '@nocobase/cache';
export class NotificationPluginStorer {
  cache: Cache;
  constructor({ cacheManager }: { cacheManager: CacheManager }) {
    this.init({ cacheManager });
  }
  async init({ cacheManager }: { cacheManager: CacheManager }) {
    this.cache = await cacheManager.createCache({
      name: 'channel',
      prefix: 'notification',
      store: 'memory',
    });
  }
  get(name: string) {}
}
