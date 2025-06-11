/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils';
import { Mutex, MutexInterface, E_CANCELED } from 'async-mutex';
import { RedisLockAdapter } from './RedisLockAdapter';
export type Releaser = () => void | Promise<void>;

export interface ILock {
  acquire(ttl: number): Releaser | Promise<Releaser>;
  runExclusive<T>(fn: () => Promise<T>, ttl: number): Promise<T>;
}

export interface ILockAdapter {
  connect(): Promise<void>;
  close(): Promise<void>;
  acquire(key: string, ttl: number): Releaser | Promise<Releaser>;
  runExclusive<T>(key: string, fn: () => Promise<T>, ttl: number): Promise<T>;
  tryAcquire(key: string, timeout?: number): Promise<ILock>;
}

export class LockAbortError extends Error {
  constructor(message, options) {
    super(message, options);
  }
}

export class LockAcquireError extends Error {
  constructor(message, options?) {
    super(message, options);
  }
}

class LocalLockAdapter implements ILockAdapter {
  static locks = new Map<string, MutexInterface>();

  async connect() {}
  async close() {}

  private getLock(key: string): MutexInterface {
    let lock = (<typeof LocalLockAdapter>this.constructor).locks.get(key);
    if (!lock) {
      lock = new Mutex();
      (<typeof LocalLockAdapter>this.constructor).locks.set(key, lock);
    }
    return lock;
  }

  async acquire(key: string, ttl: number) {
    const lock = this.getLock(key);
    const release = (await lock.acquire()) as Releaser;
    const timer = setTimeout(() => {
      if (lock.isLocked()) {
        release();
      }
    }, ttl);
    return () => {
      release();
      clearTimeout(timer);
    };
  }

  async runExclusive<T>(key: string, fn: () => Promise<T>, ttl: number): Promise<T> {
    const lock = this.getLock(key);
    let timer;
    try {
      timer = setTimeout(() => {
        if (lock.isLocked()) {
          lock.release();
        }
      }, ttl);
      return lock.runExclusive(fn);
    } catch (e) {
      if (e === E_CANCELED) {
        throw new LockAbortError('Lock aborted', { cause: E_CANCELED });
      } else {
        throw e;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  async tryAcquire(key: string) {
    const lock = this.getLock(key);
    if (lock.isLocked()) {
      throw new LockAcquireError('lock is locked');
    }
    return {
      acquire: async (ttl) => {
        return this.acquire(key, ttl);
      },
      runExclusive: async (fn: () => Promise<any>, ttl) => {
        return this.runExclusive(key, fn, ttl);
      },
    };
  }
}

export interface LockAdapterConfig<C extends ILockAdapter = ILockAdapter> {
  Adapter: new (...args: any[]) => C;
  options?: Record<string, any>;
}

export interface LockManagerOptions {
  defaultAdapter?: string;
}

export const createLockManager = (app: any, options: LockManagerOptions = {}) => {
  if (app.lockManager) {
    return app.lockManager;
  }

  app.on('afterStop', async function () {
    await this.lockManager.close();
  });

  const lockManager = new LockManager(options);
  // 注册 RedisLockAdapter
  lockManager.registerAdapter('redis', {
    Adapter: RedisLockAdapter,
    options: { url: process.env.CACHE_REDIS_URL, prefix: app.name },
  });
  return lockManager;
};

export class LockManager {
  private registry = new Registry<LockAdapterConfig>();
  private adapters = new Map<string, ILockAdapter>();

  constructor(private options: LockManagerOptions = {}) {
    this.registry.register('local', {
      Adapter: LocalLockAdapter,
    });
  }

  registerAdapter(name: string, adapterConfig: LockAdapterConfig) {
    this.registry.register(name, adapterConfig);
  }

  private async getAdapter(): Promise<ILockAdapter> {
    const type = this.options.defaultAdapter || 'local';
    let client = this.adapters.get(type);
    if (!client) {
      const adapter = this.registry.get(type);
      if (!adapter) {
        throw new Error(`Lock adapter "${type}" not registered`);
      }

      const { Adapter, options } = adapter;
      client = new Adapter(options);
      await client.connect();
      this.adapters.set(type, client);
    }

    return client;
  }

  public async close() {
    for (const client of this.adapters.values()) {
      await client.close();
    }
  }

  public async acquire(key: string, ttl = 500): Promise<Releaser> {
    const client = await this.getAdapter();
    return await client.acquire(key, ttl);
  }

  public async runExclusive<T>(key: string, fn: () => Promise<T>, ttl = 500): Promise<T> {
    const client = await this.getAdapter();
    return await client.runExclusive(key, fn, ttl);
  }

  public async tryAcquire(key: string) {
    const client = await this.getAdapter();
    return await client.tryAcquire(key);
  }
}

export default LockManager;
