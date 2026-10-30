import { createDefaultCachingConfig } from './config.js';
import { memoryCacheProviderDriver } from './drivers.js';
import { resolveTtlConfig } from './internal/duration.js';
import { assertNamespace } from './internal/validation.js';
import { settleCleanup } from './internal/lifecycle.js';
import { ManagedCacheProvider } from './internal/managed-provider.js';
import type {
  BloomFilter,
  Cache,
  CacheProvider,
  CacheProviderConfig,
  CacheProviderDriver,
  CacheProviderRuntimeOptions,
  CachingConfig,
  Counter,
  GetCacheOptions,
  GetCapabilityOptions,
} from './types.js';

interface ProviderState {
  provider: CacheProvider;
  initializationConfig: CacheProviderConfig;
}

export class Caching {
  private readonly providers = new Map<string, ProviderState>();
  private readonly initializing = new Set<string>();
  private readonly drivers = new Map<string, CacheProviderDriver>([
    [memoryCacheProviderDriver.name, memoryCacheProviderDriver],
  ]);
  private state: 'open' | 'closing' | 'closed' = 'open';
  private disposing: Promise<void> | undefined;
  private readonly config: CachingConfig;

  constructor(config: CachingConfig = createDefaultCachingConfig()) {
    validateCachingConfig(config);
    this.config = {
      default: config.default,
      providers: Object.fromEntries(
        Object.entries(config.providers).map(([name, definition]) => [
          name,
          snapshotDefinition(definition),
        ]),
      ),
    };
  }

  registerDriver(driver: CacheProviderDriver): void {
    this.assertOpen();
    if (
      !driver ||
      typeof driver.name !== 'string' ||
      !driver.name.trim() ||
      typeof driver.createProvider !== 'function'
    ) {
      throw new Error(
        'Cache provider driver must have a name and a provider factory.',
      );
    }
    if (this.drivers.has(driver.name)) {
      throw new Error(
        `Cache provider driver "${driver.name}" is already registered.`,
      );
    }
    const createProvider = driver.createProvider.bind(driver);
    this.drivers.set(driver.name, { name: driver.name, createProvider });
  }

  validateDefaultProvider(): void {
    this.assertOpen();
    this.getDriver(this.config.providers[this.config.default].driver);
  }

  getCache(options: GetCacheOptions): Cache {
    const {
      provider: providerName,
      namespace,
      defaultTtl,
      ...runtimeOptions
    } = options;
    assertNamespace(namespace);
    return this.getOrCreateProvider(providerName, runtimeOptions).createCache({
      namespace,
      defaultTtl: resolveTtlConfig(
        defaultTtl,
        `Cache "${namespace}" defaultTtl`,
      ),
    });
  }

  getCounter(options: GetCapabilityOptions): Counter {
    const { provider: providerName, namespace, ...runtimeOptions } = options;
    assertNamespace(namespace);
    return this.getOrCreateProvider(providerName, runtimeOptions).createCounter(
      { namespace },
    );
  }

  getBloomFilter(options: GetCapabilityOptions): BloomFilter {
    const { provider: providerName, namespace, ...runtimeOptions } = options;
    assertNamespace(namespace);
    return this.getOrCreateProvider(
      providerName,
      runtimeOptions,
    ).createBloomFilter({ namespace });
  }

  dispose(): Promise<void> {
    if (this.state === 'closed') return Promise.resolve();
    if (this.disposing) return this.disposing;
    this.state = 'closing';
    const cleanups: Promise<void>[] = [];
    const started = new Set<CacheProvider>();
    const closeReadyProviders = (): void => {
      for (const { provider } of this.providers.values()) {
        if (started.has(provider)) continue;
        started.add(provider);
        cleanups.push(provider.dispose());
      }
    };
    // Invalidate existing handles synchronously, including when a factory reenters close.
    closeReadyProviders();
    this.disposing = Promise.resolve()
      .then(async () => {
        // Synchronous factories that reentered dispose have returned before this second pass.
        closeReadyProviders();
        await settleCleanup(cleanups);
      })
      .then(
        () => {
          this.providers.clear();
          this.drivers.clear();
          this.state = 'closed';
        },
        (error: unknown) => {
          this.disposing = undefined;
          throw error;
        },
      );
    return this.disposing;
  }

  private assertOpen(): void {
    if (this.state !== 'open') throw new Error('Caching is closing or closed.');
  }

  private getDriver(name: string): CacheProviderDriver {
    const driver = this.drivers.get(name);
    if (!driver)
      throw new Error(`Cache provider driver "${name}" is not registered.`);
    return driver;
  }

  private getOrCreateProvider(
    requestedName: string | undefined,
    runtimeOptions: CacheProviderRuntimeOptions,
  ): CacheProvider {
    this.assertOpen();
    const name = requestedName ?? this.config.default;
    const definition = this.config.providers[name];
    if (!Object.hasOwn(this.config.providers, name)) {
      throw new Error(`Cache provider "${name}" is not configured.`);
    }

    const effectiveRuntimeOptions = removeUndefinedValues(runtimeOptions);
    const existing = this.providers.get(name);
    if (existing) {
      assertCompatibleOptions(
        name,
        existing.initializationConfig,
        effectiveRuntimeOptions,
      );
      return existing.provider;
    }

    const driver = this.getDriver(definition.driver);
    assertDoesNotOverrideStaticConfig(
      name,
      definition,
      effectiveRuntimeOptions,
    );
    const initializationConfig = {
      ...definition,
      ...effectiveRuntimeOptions,
    };
    this.assertOpen();
    if (this.initializing.has(name)) {
      throw new Error(
        `Cache provider "${name}" initialization is already in progress.`,
      );
    }
    this.initializing.add(name);
    try {
      const provider = new ManagedCacheProvider(
        driver.createProvider(initializationConfig, { name }),
      );
      this.providers.set(name, { provider, initializationConfig });
      this.assertOpen();
      return provider;
    } finally {
      this.initializing.delete(name);
    }
  }
}

export function createCaching(
  config: CachingConfig = createDefaultCachingConfig(),
): Caching {
  return new Caching(config);
}

function validateCachingConfig(config: CachingConfig): void {
  if (
    !config ||
    typeof config.default !== 'string' ||
    !config.default.trim() ||
    !config.providers ||
    typeof config.providers !== 'object' ||
    Array.isArray(config.providers)
  ) {
    throw new Error(
      'Caching config must define a default and a providers record.',
    );
  }
  if (!Object.hasOwn(config.providers, config.default)) {
    throw new Error(
      `Default cache provider "${config.default}" is not configured.`,
    );
  }
  for (const definition of Object.values(config.providers)) {
    if (
      !definition ||
      typeof definition !== 'object' ||
      Array.isArray(definition) ||
      typeof definition.driver !== 'string' ||
      !definition.driver.trim()
    ) {
      throw new Error('Cache provider config must define a driver name.');
    }
  }
}

function snapshotDefinition(
  definition: CacheProviderConfig,
): CacheProviderConfig {
  // Plain deployment configuration is captured by value. Opaque runtime extensions
  // retain identity; a driver must validate and snapshot its supported options.
  return snapshotValue(definition);
}

function snapshotValue<T>(
  value: T,
  seen: WeakMap<object, object> = new WeakMap(),
): T {
  if (!value || typeof value !== 'object') return value;
  if (
    Object.getPrototypeOf(value) !== Object.prototype &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) !== null
  )
    return value;
  const prior = seen.get(value);
  if (prior) return prior as T;
  const copy = Array.isArray(value)
    ? []
    : (Object.create(null) as Record<string, unknown>);
  seen.set(value, copy);
  for (const key of Object.keys(value)) {
    Object.defineProperty(copy, key, {
      value: snapshotValue(Reflect.get(value, key), seen),
      enumerable: true,
    });
  }
  return Object.freeze(copy) as T;
}

function removeUndefinedValues(
  options: CacheProviderRuntimeOptions,
): CacheProviderRuntimeOptions {
  return Object.fromEntries(
    Object.entries(options).filter(([, value]) => value !== undefined),
  );
}

function assertDoesNotOverrideStaticConfig(
  providerName: string,
  definition: CacheProviderConfig,
  runtimeOptions: CacheProviderRuntimeOptions,
): void {
  for (const [key, value] of Object.entries(runtimeOptions)) {
    if (key in definition && definition[key] !== value) {
      throw new Error(
        `Cache provider "${providerName}" has a different static "${key}" option.`,
      );
    }
  }
}

function assertCompatibleOptions(
  providerName: string,
  initializationConfig: CacheProviderConfig,
  runtimeOptions: CacheProviderRuntimeOptions,
): void {
  for (const [key, value] of Object.entries(runtimeOptions)) {
    if (initializationConfig[key] !== value) {
      throw new Error(
        `Cache provider "${providerName}" is already initialized with a different "${key}" option.`,
      );
    }
  }
}
