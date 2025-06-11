/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ILock, ILockAdapter, LockAcquireError, Releaser } from './lock-manager';
import Redlock from 'redlock';
import Redis from 'ioredis';
import { createConsoleLogger, Logger } from '@nocobase/logger';

type RedisLockAdapterOptions = {
  url: string;
  prefix?: string;
};

export class RedisLockAdapter implements ILockAdapter {
  private client: Redis;
  private redlock: Redlock;
  private logger: Logger;
  private options: RedisLockAdapterOptions;
  constructor(options: RedisLockAdapterOptions) {
    this.options = options;
    this.logger = createConsoleLogger();
    this.client = new Redis(options.url);
    this.redlock = new Redlock([this.client], {
      retryCount: 0, // 增加重试次数
      retryDelay: 200, // 增加重试延迟，单位为毫秒
    });
  }
  private getLockKey(key: string) {
    if (key.startsWith(`_lock:${this.options.prefix}:`)) {
      return key;
    }
    return this.options.prefix ? `_lock:${this.options.prefix}:${key}` : `_lock:${key}`;
  }
  async connect(): Promise<void> {
    // if (!this.client.status || this.client.status === 'end') {
    //   await this.client.connect();
    // }
  }

  async close(): Promise<void> {
    this.logger.debug(`RedisLockAdapter close !!`);
    // Redis 客户端关闭逻辑
    await this.client.quit();
  }

  async acquire(key: string, ttl: number): Promise<Releaser> {
    const lockKey = this.getLockKey(key);
    try {
      this.logger.debug(`Acquiring a lock on resource "${lockKey}"`);
      const lock = await this.redlock.lock(lockKey, ttl);
      return async () => {
        try {
          this.logger.debug(`Releasing the lock on resource "${lockKey}"`);
          if (lock) {
            await lock.unlock();
          }
        } catch (err) {
          this.logger.warn(`Unable to fully release the lock on resource "${lockKey}" =>`, err);
        }
      };
    } catch (err) {
      this.logger.debug('Failed to acquire lock =>', err);
      throw new LockAcquireError('Failed to acquire lock', { cause: err });
    }
  }

  async runExclusive<T>(key: string, fn: () => Promise<T>, ttl: number): Promise<T> {
    let release: Releaser;
    const lockKey = this.getLockKey(key);
    try {
      release = await this.acquire(lockKey, ttl);
    } catch (err) {
      if (err instanceof LockAcquireError) {
        this.logger.warn(`Another instance is already performing the operation for key: ${lockKey}`);
      } else {
        this.logger.error('Failed to perform exclusive operation:', err);
        throw err;
      }
      return; // 直接返回以避免继续执行
    }

    try {
      return await fn();
    } finally {
      await release();
    }
  }

  async tryAcquire(key: string, ttl = 5000): Promise<ILock> {
    const lockKey = this.getLockKey(key);
    try {
      const lock = await this.redlock.lock(lockKey, ttl);
      return {
        acquire: async (ttl) => {
          await lock.extend(ttl);
          return async () => {
            await lock.unlock();
          };
        },
        runExclusive: async (fn: () => Promise<any>, ttl) => {
          await lock.extend(ttl);
          try {
            return await fn();
          } finally {
            await lock.unlock();
          }
        },
      };
    } catch (err) {
      throw new LockAcquireError('Failed to acquire lock', { cause: err });
    }
  }
}
