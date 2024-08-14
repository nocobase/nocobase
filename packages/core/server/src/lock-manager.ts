/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils';
import { Mutex, tryAcquire, MutexInterface, E_CANCELED } from 'async-mutex';

export type Releaser = () => void | Promise<void>;

export abstract class AbstractLockAdapter {
  async connect() {}
  async close() {}
  abstract acquire(key: string, ttl: number): Releaser | Promise<Releaser>;
  abstract runExclusive<T>(key: string, fn: () => Promise<T>, ttl: number): Promise<T>;
  // abstract tryAcquire(key: string, ttl: number): Releaser | Promise<Releaser>;
}

export class LockAbortError extends Error {
  constructor(message, options) {
    super(message, options);
  }
}

class LocalLockAdapter extends AbstractLockAdapter {
  static locks = new Map<string, MutexInterface>();

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
  // async tryAcquire(key: string, ttl: number) {
  //   const lock = this.getLock(key);
  //   return lock.tryAcquire(ttl);
  // }
}

export interface LockAdapterConfig<C extends AbstractLockAdapter = AbstractLockAdapter> {
  Adapter: new (...args: any[]) => C;
  options?: Record<string, any>;
}

export interface LockManagerOptions {
  defaultAdapter?: string;
}

export class LockManager {
  private registry = new Registry<LockAdapterConfig>();
  private adapters = new Map<string, AbstractLockAdapter>();

  constructor(private options: LockManagerOptions = {}) {
    this.registry.register('local', {
      Adapter: LocalLockAdapter,
    });
  }

  registerAdapter(name: string, adapterConfig: LockAdapterConfig) {
    this.registry.register(name, adapterConfig);
  }

  private async getAdapter(): Promise<AbstractLockAdapter> {
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

  public async acquire(key: string, ttl = 500) {
    const client = await this.getAdapter();
    return client.acquire(key, ttl);
  }

  public async runExclusive<T>(key: string, fn: () => Promise<T>, ttl = 500): Promise<T> {
    const client = await this.getAdapter();
    return client.runExclusive(key, fn, ttl);
  }

  // public async tryAcquire(key: string, ttl = 500) {
  //   const client = await this.getAdapter();
  //   return client.tryAcquire(key, ttl);
  // }
}
