import { createDefaultCachingConfig } from './config.js';
import { memoryCacheProviderDriver } from './drivers.js';
import { resolveTtlConfig } from './internal/duration.js';
import { assertNamespace } from './internal/validation.js';
import type {
  BloomFilter,
  Cache,
  CacheProvider,
  CacheProviderConfig,
  CacheProviderDriver,
  CacheProviderRuntimeOptions,
  CachingBackendDescription,
  CachingConfig,
  CachingDescription,
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
  private readonly drivers = new Map<string, CacheProviderDriver>([
    [memoryCacheProviderDriver.name, memoryCacheProviderDriver],
  ]);
  /** Namespaces that named a provider explicitly, for {@link Caching.describe}. */
  private readonly selections = new Map<string, string>();

  constructor(
    private readonly config: CachingConfig = createDefaultCachingConfig(),
  ) {
    validateCachingConfig(config);
  }

  registerDriver(driver: CacheProviderDriver): void {
    const { name } = driver;
    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof driver.createProvider !== 'function' ||
      driver.createProvider.constructor.name === 'AsyncFunction'
    ) {
      throw new Error(
        'Cache provider driver requires a nonempty name and a synchronous factory.',
      );
    }
    if (this.drivers.has(name)) {
      throw new Error(`Cache provider driver "${name}" is already registered.`);
    }
    if (
      driver.sharing !== undefined &&
      driver.sharing !== 'local' &&
      driver.sharing !== 'shared'
    ) {
      throw new Error(
        `Cache provider driver "${name}" declares an unknown sharing "${String(driver.sharing)}".`,
      );
    }
    this.drivers.set(name, {
      name,
      ...(driver.sharing ? { sharing: driver.sharing } : {}),
      createProvider: driver.createProvider.bind(driver),
    });
  }

  /**
   * Reports the configured providers by name and driver. Options are never copied: a provider's configuration may
   * carry connection addresses and credentials.
   */
  describe(): CachingDescription {
    const backends = Object.entries(this.config.providers).map(
      ([name, definition]): CachingBackendDescription => {
        const driver = this.drivers.get(definition.driver);
        return {
          name,
          adapter: definition.driver,
          sharing: driver?.sharing ?? 'unknown',
          registered: driver !== undefined,
        };
      },
    );
    const selected = backends.find(({ name }) => name === this.config.default)!;
    return {
      default: selected.name,
      adapter: selected.adapter,
      sharing: selected.sharing,
      registered: selected.registered,
      backends,
      selections: [...this.selections]
        .filter(([, backend]) => backend !== this.config.default)
        .map(([consumer, backend]) => ({ consumer, backend })),
    };
  }

  getCache(options: GetCacheOptions): Cache {
    const {
      provider: providerName,
      namespace,
      defaultTtl,
      ...runtimeOptions
    } = options;
    assertNamespace(namespace);
    const provider = this.getOrCreateProvider(providerName, runtimeOptions);
    this.recordSelection(namespace, providerName);
    return provider.createCache({
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
    const provider = this.getOrCreateProvider(providerName, runtimeOptions);
    this.recordSelection(namespace, providerName);
    return provider.createCounter({ namespace });
  }

  getBloomFilter(options: GetCapabilityOptions): BloomFilter {
    const { provider: providerName, namespace, ...runtimeOptions } = options;
    assertNamespace(namespace);
    const provider = this.getOrCreateProvider(providerName, runtimeOptions);
    this.recordSelection(namespace, providerName);
    return provider.createBloomFilter({ namespace });
  }

  async dispose(): Promise<void> {
    const providers = [
      ...new Set([...this.providers.values()].map(({ provider }) => provider)),
    ];
    this.providers.clear();
    await Promise.all(providers.map((provider) => provider.dispose()));
  }

  private recordSelection(
    namespace: string,
    provider: string | undefined,
  ): void {
    if (provider !== undefined) this.selections.set(namespace, provider);
  }

  private getOrCreateProvider(
    requestedName: string | undefined,
    runtimeOptions: CacheProviderRuntimeOptions,
  ): CacheProvider {
    const name = requestedName ?? this.config.default;
    const definition = this.config.providers[name];
    if (!Object.hasOwn(this.config.providers, name) || !definition) {
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

    const driver = this.drivers.get(definition.driver);
    if (!driver) {
      throw new Error(
        `Cache provider driver "${definition.driver}" is not registered.`,
      );
    }
    assertDoesNotOverrideStaticConfig(
      name,
      definition,
      effectiveRuntimeOptions,
    );
    const initializationConfig = {
      ...definition,
      ...effectiveRuntimeOptions,
    };
    const provider = driver.createProvider(initializationConfig, { name });
    this.providers.set(name, { provider, initializationConfig });
    return provider;
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
    typeof config !== 'object' ||
    typeof config.default !== 'string' ||
    !config.providers ||
    typeof config.providers !== 'object' ||
    Array.isArray(config.providers)
  ) {
    throw new Error(
      'Caching config requires a default name and provider definitions.',
    );
  }
  if (
    !Object.hasOwn(config.providers, config.default) ||
    !config.providers[config.default]
  ) {
    throw new Error(
      `Default cache provider "${config.default}" is not configured.`,
    );
  }
  for (const provider of Object.values(config.providers)) {
    if (
      !provider ||
      typeof provider !== 'object' ||
      Array.isArray(provider) ||
      !Object.hasOwn(provider, 'driver') ||
      typeof provider.driver !== 'string' ||
      !provider.driver.trim()
    ) {
      throw new Error('Cache provider requires a nonempty driver name.');
    }
  }
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
