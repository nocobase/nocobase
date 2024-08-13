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

export type Releaser = () => void | Promise<void>;

export abstract class AbstractLockAdapter {
  async connect() {}
  async close() {}
  abstract acquire(key: string, ttl: number): Releaser | Promise<Releaser>;
  abstract runExclusive<T>(key: string, fn: () => Promise<T>, ttl: number): Promise<T>;
}

export class LockAbortError extends Error {
  constructor(message, options) {
    super(message, options);
  }
}

export class LocalLock {
  private lock: MutexInterface;

  constructor(private ttl: number) {
    this.lock = new Mutex();
  }

  setTTL(ttl: number) {
    this.ttl = ttl;
  }

  async acquire() {
    const release = (await this.lock.acquire()) as Releaser;
    const timer = setTimeout(() => {
      if (this.lock.isLocked()) {
        release();
      }
    }, this.ttl);
    return () => {
      release();
      clearTimeout(timer);
    };
  }

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    let timer;
    try {
      timer = setTimeout(() => {
        if (this.lock.isLocked()) {
          this.lock.release();
        }
      });
      return this.lock.runExclusive(fn);
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
}

class LocalLockAdapter extends AbstractLockAdapter {
  private locks = new Map<string, LocalLock>();

  private getLock(key: string, ttl: number): LocalLock {
    let lock = this.locks.get(key);
    if (!lock) {
      lock = new LocalLock(ttl);
      this.locks.set(key, lock);
    } else {
      lock.setTTL(ttl);
    }
    return lock;
  }

  async acquire(key: string, ttl: number) {
    const lock = this.getLock(key, ttl);
    return lock.acquire();
  }

  async runExclusive<T>(key: string, fn: () => Promise<T>, ttl: number): Promise<T> {
    const lock = this.getLock(key, ttl);
    return lock.runExclusive(fn);
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

  private async getClient(): Promise<AbstractLockAdapter> {
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

    return client;
  }

  public async acquire(key: string, ttl = 500) {
    const client = await this.getClient();
    return client.acquire(key, ttl);
  }

  public async runExclusive<T>(key: string, fn: () => Promise<T>, ttl = 500): Promise<T> {
    const client = await this.getClient();
    return client.runExclusive(key, fn, ttl);
  }
}
