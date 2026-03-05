/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils';
import { Mutex, MutexInterface, E_CANCELED, withTimeout } from 'async-mutex';

export type Releaser = () => void | Promise<void>;

/**
 * A lock handle returned by {@link ILockAdapter.tryAcquire}.
 *
 * **Important**: the underlying mutex is already held when this object is
 * returned.  The caller MUST invoke either `acquire()` or `runExclusive()`
 * promptly; if neither is called the lock will be held indefinitely.
 */
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

  async tryAcquire(key: string, timeout = 0) {
    const mutex = this.getLock(key);
    let preAcquiredRelease: Releaser;

    if (timeout === 0) {
      // Non-blocking: throw immediately if the lock is already held.
      // mutex.acquire() is called synchronously (before any await boundary) so
      // that _locked=true is set atomically within the current JS execution
      // slice, preventing TOCTOU races in single-process cluster simulations
      // (e.g. tests using createMockCluster).
      if (mutex.isLocked()) {
        throw new LockAcquireError('lock is locked');
      }
      preAcquiredRelease = (await mutex.acquire()) as Releaser;
    } else {
      // Blocking with timeout: wait up to `timeout` ms for the lock, then
      // throw. withTimeout() from async-mutex handles queue cleanup properly
      // when the timeout fires before the lock is acquired.
      try {
        preAcquiredRelease = (await withTimeout(mutex, timeout).acquire()) as Releaser;
      } catch (e) {
        throw new LockAcquireError('lock acquire timed out', { cause: e });
      }
    }

    let preAcquiredConsumed = false;

    const getRelease = async (): Promise<Releaser> => {
      const rawRelease: Releaser = !preAcquiredConsumed
        ? ((preAcquiredConsumed = true), preAcquiredRelease)
        : ((await mutex.acquire()) as Releaser);
      // Idempotency guard: prevents double-release when both the TTL auto-
      // release timer and the caller-facing releaser (or finally block) fire.
      let released = false;
      return () => {
        if (!released) {
          released = true;
          return (rawRelease as () => void | Promise<void>)();
        }
      };
    };

    return {
      acquire: async (ttl: number): Promise<Releaser> => {
        const release = await getRelease();
        const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
          if (mutex.isLocked()) {
            release();
          }
        }, ttl);
        return () => {
          release();
          clearTimeout(timer);
        };
      },
      runExclusive: async <T>(fn: () => Promise<T>, ttl: number): Promise<T> => {
        const release = await getRelease();
        let timer: ReturnType<typeof setTimeout>;
        try {
          timer = setTimeout(() => {
            if (mutex.isLocked()) {
              release();
            }
          }, ttl);
          return await fn();
        } catch (e) {
          if (e === E_CANCELED) {
            throw new LockAbortError('Lock aborted', { cause: E_CANCELED });
          } else {
            throw e;
          }
        } finally {
          clearTimeout(timer);
          release();
        }
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
    return client.acquire(key, ttl);
  }

  public async runExclusive<T>(key: string, fn: () => Promise<T>, ttl = 500): Promise<T> {
    const client = await this.getAdapter();
    return client.runExclusive(key, fn, ttl);
  }

  public async tryAcquire(key: string, timeout = 0) {
    const client = await this.getAdapter();
    return client.tryAcquire(key, timeout);
  }
}

export default LockManager;
