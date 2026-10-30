import type {
  BloomFilter,
  Cache,
  CacheOptions,
  CacheProvider,
  Counter,
  MemoryCacheProviderOptions,
  NamespacedOptions,
} from './types.js';
import { MemoryCache } from './memory-cache.js';
import { MemoryCounter } from './memory-counter.js';
import { MemoryBloomFilter } from './memory-bloom-filter.js';
import {
  assertMaxSize,
  assertNamespace,
  assertTtl,
} from './internal/validation.js';
import { ManagedCacheProvider } from './internal/managed-provider.js';
import { settleCleanup } from './internal/lifecycle.js';
import { resolveTtlConfig } from './internal/duration.js';

export class MemoryCacheProvider extends ManagedCacheProvider {
  constructor(options: MemoryCacheProviderOptions = {}) {
    super(new MemoryProviderResources(options));
  }
}
class MemoryProviderResources implements CacheProvider {
  private readonly maxSize: number;
  private readonly defaultTtl?: number;
  private readonly maxTtl?: number;
  private readonly checkInterval?: number;
  private readonly useClone: boolean;
  private readonly caches = new Map<
    string,
    { cache: MemoryCache; defaultTtl?: number }
  >();
  private readonly counters = new Map<string, MemoryCounter>();
  private readonly bloomFilters = new Map<string, MemoryBloomFilter>();

  constructor(options: MemoryCacheProviderOptions = {}) {
    this.maxSize = options.maxSize ?? 2_000;
    this.defaultTtl = resolveTtlConfig(
      options.defaultTtl,
      'Memory cache defaultTtl',
    );
    this.maxTtl = resolveTtlConfig(options.maxTtl, 'Memory cache maxTtl');
    this.checkInterval = resolveTtlConfig(
      options.checkInterval,
      'Memory cache checkInterval',
    );
    this.useClone = options.useClone ?? true;
    assertMaxSize(this.maxSize);
    assertTtl(this.defaultTtl);
    assertTtl(this.maxTtl);
    assertTtl(this.checkInterval);
  }

  createCache(options: CacheOptions): Cache {
    assertNamespace(options.namespace);
    const defaultTtl = resolveTtlConfig(
      options.defaultTtl ?? this.defaultTtl,
      'Memory cache defaultTtl',
    );
    assertTtl(defaultTtl);
    const existing = this.caches.get(options.namespace);
    if (existing) {
      if (existing.defaultTtl !== defaultTtl) {
        throw new Error(
          `Cache namespace "${options.namespace}" already uses a different default TTL.`,
        );
      }
      return existing.cache;
    }

    const cache = new MemoryCache({
      namespace: options.namespace,
      maxSize: this.maxSize,
      defaultTtl,
      maxTtl: this.maxTtl,
      checkInterval: this.checkInterval,
      useClone: this.useClone,
    });
    this.caches.set(options.namespace, { cache, defaultTtl });
    return cache;
  }

  createCounter(options: NamespacedOptions): Counter {
    assertNamespace(options.namespace);
    const existing = this.counters.get(options.namespace);
    if (existing) {
      return existing;
    }
    const counter = new MemoryCounter({
      namespace: options.namespace,
      maxSize: this.maxSize,
    });
    this.counters.set(options.namespace, counter);
    return counter;
  }

  createBloomFilter(options: NamespacedOptions): BloomFilter {
    assertNamespace(options.namespace);
    const existing = this.bloomFilters.get(options.namespace);
    if (existing) {
      return existing;
    }
    const filter = new MemoryBloomFilter(options.namespace);
    this.bloomFilters.set(options.namespace, filter);
    return filter;
  }

  async dispose(): Promise<void> {
    const cleanups = [...this.caches.entries()].map(
      async ([namespace, { cache }]) => {
        await cache.disconnect();
        this.caches.delete(namespace);
      },
    );
    for (const counter of this.counters.values()) counter.clear();
    for (const filter of this.bloomFilters.values()) filter.clear();
    this.counters.clear();
    this.bloomFilters.clear();
    await settleCleanup(cleanups);
  }
}
