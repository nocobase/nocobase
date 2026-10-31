import type {
  BloomFilter,
  Cache,
  CacheOptions,
  CacheProvider,
  Counter,
  NamespacedOptions,
} from '../types.js';
import { OperationScope } from './lifecycle.js';

/** A host-owned lifetime boundary; inner wrap calls can finish their admitted writeback. */
export class ManagedCacheProvider implements CacheProvider {
  private readonly scope = new OperationScope();
  private readonly caches = new WeakMap<Cache, Cache>();
  private readonly counters = new WeakMap<Counter, Counter>();
  private readonly filters = new WeakMap<BloomFilter, BloomFilter>();

  constructor(private readonly provider: CacheProvider) {}

  createCache(options: CacheOptions): Cache {
    this.scope.assertOpen();
    const cache = this.provider.createCache(options);
    const existing = this.caches.get(cache);
    if (existing) return existing;
    const scope = this.scope;
    const managed: Cache = {
      namespace: cache.namespace,
      get: <T>(key: string): Promise<T | undefined> =>
        scope.run(() => cache.get<T>(key)),
      getMany: <T>(keys: readonly string[]): Promise<Array<T | undefined>> => {
        const snapshot = [...keys];
        return scope.run(() => cache.getMany<T>(snapshot));
      },
      has: (key) => scope.run(() => cache.has(key)),
      set: (key, value, ttl) => scope.run(() => cache.set(key, value, ttl)),
      setMany: (entries) => {
        const snapshot = entries.map((entry) => ({ ...entry }));
        return scope.run(() => cache.setMany(snapshot));
      },
      delete: (key) => scope.run(() => cache.delete(key)),
      deleteMany: (keys) => {
        const snapshot = [...keys];
        return scope.run(() => cache.deleteMany(snapshot));
      },
      take: <T>(key: string): Promise<T | undefined> =>
        scope.run(() => cache.take<T>(key)),
      wrap: (key, loader, ttl) => scope.run(() => cache.wrap(key, loader, ttl)),
    };
    this.caches.set(cache, managed);
    return managed;
  }

  createCounter(options: NamespacedOptions): Counter {
    this.scope.assertOpen();
    const counter = this.provider.createCounter(options);
    const existing = this.counters.get(counter);
    if (existing) return existing;
    const scope = this.scope;
    const managed: Counter = {
      namespace: counter.namespace,
      get: (key) => scope.run(() => counter.get(key)),
      increment: (key, amount, ttl) =>
        scope.run(() => counter.increment(key, amount, ttl)),
      reset: (key) => scope.run(() => counter.reset(key)),
    };
    this.counters.set(counter, managed);
    return managed;
  }

  createBloomFilter(options: NamespacedOptions): BloomFilter {
    this.scope.assertOpen();
    const filter = this.provider.createBloomFilter(options);
    const existing = this.filters.get(filter);
    if (existing) return existing;
    const scope = this.scope;
    const managed: BloomFilter = {
      namespace: filter.namespace,
      reserve: (key, parameters) => {
        const snapshot = { ...parameters };
        return scope.run(() => filter.reserve(key, snapshot));
      },
      add: (key, value) => scope.run(() => filter.add(key, value)),
      addMany: (key, values) => {
        const snapshot = [...values];
        return scope.run(() => filter.addMany(key, snapshot));
      },
      has: (key, value) => scope.run(() => filter.has(key, value)),
      delete: (key) => scope.run(() => filter.delete(key)),
    };
    this.filters.set(filter, managed);
    return managed;
  }

  dispose(): Promise<void> {
    return this.scope.close(() => this.provider.dispose());
  }
}
