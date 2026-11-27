export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
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

  /** Atomically increments a value. TTL is applied only when the value is first created. */
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

/**
 * Whether a backend's state is visible to every instance of the application (`shared`) or only to the process that
 * holds it (`local`). A driver or adapter that does not declare it is reported as `unknown`.
 */
export type BackendSharing = 'local' | 'shared' | 'unknown';

export interface CacheProviderDriver {
  readonly name: string;
  /** Declared by the driver: `local` keeps entries in this process, `shared` in a store every instance reaches. */
  readonly sharing?: 'local' | 'shared';
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

/** One configured provider, without any of its options. */
export interface CachingBackendDescription {
  readonly name: string;
  readonly adapter: string;
  readonly sharing: BackendSharing;
  readonly registered: boolean;
}

/** A consumer that names a provider other than the default. */
export interface CachingSelection {
  readonly consumer: string;
  readonly backend: string;
}

/**
 * What the caching service runs on, read from its configuration and registered drivers. It carries names only, never
 * a provider's options, which may hold connection addresses and credentials.
 */
export interface CachingDescription {
  readonly default: string;
  readonly adapter: string;
  readonly sharing: BackendSharing;
  readonly registered: boolean;
  readonly backends: readonly CachingBackendDescription[];
  readonly selections: readonly CachingSelection[];
}
