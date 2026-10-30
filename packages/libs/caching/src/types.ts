export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  /** Positive milliseconds rounded upward; undefined inherits Cache defaults. */
  ttl?: number;
}

export interface Cache {
  readonly namespace: string;

  get<T>(key: string): Promise<T | undefined>;
  getMany<T>(keys: readonly string[]): Promise<Array<T | undefined>>;
  has(key: string): Promise<boolean>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  setMany<T>(entries: readonly CacheEntry<T>[]): Promise<void>;
  delete(key: string): Promise<boolean>;
  deleteMany(keys: readonly string[]): Promise<number>;

  /** Atomically reads and removes a value. */
  take<T>(key: string): Promise<T | undefined>;

  /** Loads and caches a missing value, coalescing concurrent loads in this process. */
  wrap<T>(key: string, loader: () => T | Promise<T>, ttl?: number): Promise<T>;
}

export interface Counter {
  readonly namespace: string;

  get(key: string): Promise<number>;

  /** Atomically adds a finite signed/fractional amount; rejects non-finite results. TTL applies only at creation. */
  increment(key: string, amount?: number, ttl?: number): Promise<number>;

  reset(key: string): Promise<void>;
}

export interface BloomFilterOptions {
  capacity: number;
  errorRate: number;
}

export interface BloomFilter {
  readonly namespace: string;

  reserve(key: string, options: BloomFilterOptions): Promise<void>;
  add(key: string, value: string): Promise<void>;
  addMany(key: string, values: string[]): Promise<void>;
  has(key: string, value: string): Promise<boolean>;
  delete(key: string): Promise<void>;
}

export interface CacheOptions {
  namespace: string;
  defaultTtl?: number;
}

export interface NamespacedOptions {
  namespace: string;
}

export interface CacheProvider {
  createCache(options: CacheOptions): Cache;
  createCounter(options: NamespacedOptions): Counter;
  createBloomFilter(options: NamespacedOptions): BloomFilter;
  /** Reject new work, drain admitted operations, and release owned resources. Failures remain retryable. */
  dispose(): Promise<void>;
}

export type CacheTtlConfig = number | string;

export interface CacheProviderConfig {
  driver: string;
  [key: string]: unknown;
}

export interface MemoryCacheProviderConfig extends CacheProviderConfig {
  driver: 'memory';
  maxSize?: number;
  defaultTtl?: CacheTtlConfig;
  maxTtl?: CacheTtlConfig;
  checkInterval?: CacheTtlConfig;
  useClone?: boolean;
}

export interface CachingConfig {
  default: string;
  providers: Readonly<Record<string, CacheProviderConfig>>;
}

export interface CacheProviderDriverContext {
  name: string;
}

export interface CacheProviderDriver {
  readonly name: string;
  /** Synchronously validate selected options and create a lazy, application-owned provider without network I/O. */
  createProvider(
    config: CacheProviderConfig,
    context: CacheProviderDriverContext,
  ): CacheProvider;
}

export interface GetCacheOptions extends CacheProviderRuntimeOptions {
  namespace: string;
  provider?: string;
  defaultTtl?: CacheTtlConfig;
}

export interface GetCapabilityOptions extends CacheProviderRuntimeOptions {
  namespace: string;
  provider?: string;
}

export interface CacheProviderRuntimeOptions {
  [key: string]: unknown;
}

export interface MemoryCacheProviderOptions {
  /** Maximum entries in each cache or counter namespace. */
  maxSize?: number;
  /** Default cache TTL in milliseconds. */
  defaultTtl?: number;
  /** Maximum cache TTL in milliseconds. */
  maxTtl?: number;
  /** Expired-entry cleanup interval in milliseconds. */
  checkInterval?: number;
  /** Clone cached values on read and write. */
  useClone?: boolean;
}
