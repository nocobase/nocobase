import {
  createKeyv,
  KeyvCacheableMemory,
  type CacheableMemory,
} from '@cacheable/memory';
import type { Keyv } from 'keyv';
import type { Cache, CacheEntry } from './types.js';
import { KeyedLock } from './internal/keyed-lock.js';
import { assertNamespace, assertTtl } from './internal/validation.js';
import { resolveTtlConfig } from './internal/duration.js';

export interface MemoryCacheOptions {
  namespace: string;
  maxSize: number;
  defaultTtl?: number;
  maxTtl?: number;
  checkInterval?: number;
  useClone?: boolean;
}

export class MemoryCache implements Cache {
  readonly namespace: string;
  private readonly store: Keyv;
  private readonly memory: CacheableMemory;
  private readonly lock = new KeyedLock();
  private readonly pending = new Map<string, Promise<unknown>>();

  constructor(options: MemoryCacheOptions) {
    assertNamespace(options.namespace);
    assertTtl(options.defaultTtl);
    this.namespace = options.namespace;
    const checkInterval = resolveTtlConfig(
      options.checkInterval,
      'Memory cache checkInterval',
    );
    this.store = createKeyv({
      namespace: options.namespace,
      ttl: resolveTtlConfig(options.defaultTtl, 'Memory cache defaultTtl'),
      maxTtl: resolveTtlConfig(options.maxTtl, 'Memory cache maxTtl'),
      lruSize: options.maxSize,
      useClone: options.useClone ?? true,
    });
    const adapter: unknown = this.store.store;
    if (!(adapter instanceof KeyvCacheableMemory)) {
      throw new Error(
        'Memory cache did not create its expected storage adapter.',
      );
    }
    this.memory = adapter.store;
    // The adapter also creates an unused default store. Start only the owned namespace's timer.
    if (checkInterval !== undefined) {
      this.memory.checkInterval = checkInterval;
      this.memory.startIntervalCheck();
    }
  }

  get<T>(key: string): Promise<T | undefined> {
    return this.lock.run(key, () => this.store.get<T>(key));
  }

  getMany<T>(keys: readonly string[]): Promise<Array<T | undefined>> {
    return Promise.all(keys.map((key) => this.get<T>(key)));
  }

  has(key: string): Promise<boolean> {
    return this.lock.run(key, () => this.store.has(key));
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    assertTtl(ttl);
    await this.lock.run(key, async () => {
      await this.store.set(key, value, resolveTtlConfig(ttl, 'Cache TTL'));
    });
  }

  async setMany<T>(entries: readonly CacheEntry<T>[]): Promise<void> {
    for (const entry of entries) assertTtl(entry.ttl);
    await Promise.all(
      entries.map((entry) => this.set(entry.key, entry.value, entry.ttl)),
    );
  }

  delete(key: string): Promise<boolean> {
    return this.lock.run(key, async () => {
      const existed = await this.store.has(key);
      if (existed) {
        await this.store.delete(key);
      }
      return existed;
    });
  }

  async deleteMany(keys: readonly string[]): Promise<number> {
    const results = await Promise.all(keys.map((key) => this.delete(key)));
    return results.filter(Boolean).length;
  }

  take<T>(key: string): Promise<T | undefined> {
    return this.lock.run(key, async () => {
      const value = await this.store.get<T>(key);
      if (value !== undefined) {
        await this.store.delete(key);
      }
      return value;
    });
  }

  async wrap<T>(
    key: string,
    loader: () => T | Promise<T>,
    ttl?: number,
  ): Promise<T> {
    assertTtl(ttl);
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const active = this.pending.get(key);
    if (active) {
      return active as Promise<T>;
    }

    const loading = Promise.resolve()
      .then(loader)
      .then(async (value) => {
        if (value !== undefined) {
          await this.set(key, value, ttl);
        }
        return value;
      })
      .finally(() => {
        if (this.pending.get(key) === loading) {
          this.pending.delete(key);
        }
      });
    this.pending.set(key, loading);
    return loading;
  }

  async disconnect(): Promise<void> {
    this.memory.stopIntervalCheck();
    await this.store.disconnect();
    this.memory.clear();
  }
}
