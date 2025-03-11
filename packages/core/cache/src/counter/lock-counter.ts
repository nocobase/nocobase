/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LockManager } from '@nocobase/lock-manager';
import { Counter as ICounter } from '.';
import { Cache } from '../cache';

/**
 * @experimental
 */
export class LockCounter implements ICounter {
  cache: Cache;
  lockManager: LockManager;
  constructor(cache: Cache, lockManager: LockManager) {
    this.cache = cache;
    this.lockManager = lockManager;
  }

  async get(key: string) {
    return ((await this.cache.get(key)) as number) || 0;
  }

  async incr(key: string, ttl?: number) {
    return this.incrby(key, 1, ttl);
  }

  async incrby(key: string, value: number, ttl?: number) {
    const lockKey = `lock:${key}`;
    const release = await this.lockManager.acquire(lockKey, 3000);
    try {
      const v = (await this.cache.get(key)) as number;
      const n = v || 0;
      const newValue = n + value;
      await this.cache.set(key, newValue, ttl);
      return newValue;
    } catch (error) {
      throw error;
    } finally {
      await release();
    }
  }

  async reset(key: string) {
    return this.cache.del(key);
  }
}
