/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils';
import { Mutex, withTimeout, MutexInterface, E_CANCELED } from 'async-mutex';

export abstract class AbstractLockAdapter<L extends AbstractLock = AbstractLock> {
  async connect() {}
  abstract getLock(key: string, ttl: number): L | Promise<L>;
  abstract acquire(key: string, ttl: number): L | Promise<L>;
  abstract release(key: string): void | Promise<void>;
}

export abstract class AbstractLock {
  abstract acquire(): Promise<AbstractLock>;
  abstract release(): Promise<void>;
  abstract runExclusive<T>(fn: () => Promise<T>): Promise<T>;
}

export class LockAbortError extends Error {
  constructor(message, options) {
    super(message, options);
  }
}

export class LocalLock extends AbstractLock {
  private lock: MutexInterface;

  constructor(ttl) {
    super();
    this.lock = withTimeout(new Mutex(), ttl);
  }

  async acquire() {
    await this.lock.acquire();
    return this;
  }

  async release() {
    this.lock.release();
  }

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return this.lock.runExclusive(fn);
    } catch (e) {
      if (e === E_CANCELED) {
        throw new LockAbortError('Lock aborted', { cause: E_CANCELED });
      } else {
        throw e;
      }
    }
  }
}

class LocalLockAdapter extends AbstractLockAdapter<LocalLock> {
  private locks = new Map<string, LocalLock>();

  getLock(key: string, ttl: number): LocalLock {
    let lock = this.locks.get(key);
    if (!lock) {
      lock = new LocalLock(ttl);
      this.locks.set(key, lock);
    }
    return lock;
  }

  async acquire(key: string, ttl?: number) {
    const lockInstance = this.getLock(key, ttl);
    return lockInstance.acquire();
  }

  async release(lockKey) {
    if (this.locks.has(lockKey)) {
      const lock = this.locks.get(lockKey);
      await lock.release();
    }
  }
}

export interface LockAdapterConfig<C extends AbstractLockAdapter = AbstractLockAdapter> {
  Client: new (...args: any[]) => C;
  [key: string]: any;
}

export interface LockManagerOptions {
  defaultAdapter?: string;
}

export class LockManager {
  private registry = new Registry<LockAdapterConfig>();
  private clients = new Map<string, AbstractLockAdapter>();

  constructor(private options: LockManagerOptions = {}) {
    this.registry.register('local', {
      Client: LocalLockAdapter,
    });
  }

  registerAdapter(name: string, adapterConfig: LockAdapterConfig) {
    this.registry.register(name, adapterConfig);
  }

  async getLock(key: string, ttl = 500): Promise<AbstractLock> {
    const type = this.options.defaultAdapter || 'local';
    let client = this.clients.get(type);
    if (!client) {
      const adapter = this.registry.get(type);
      if (!adapter) {
        throw new Error(`Lock adapter "${type}" not registered`);
      }

      const { Client, ...config } = adapter;
      client = new Client(config);
      await client.connect();
      this.clients.set(type, client);
    }

    return client.getLock(key, ttl);
  }
}
