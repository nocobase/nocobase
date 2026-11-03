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
  private readonly drivers = new Map<string, CacheProviderDriver>([
    [memoryCacheProviderDriver.name, memoryCacheProviderDriver],
  ]);

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
    this.drivers.set(name, {
      name,
      createProvider: driver.createProvider.bind(driver),
    });
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

  async dispose(): Promise<void> {
    const providers = [
      ...new Set([...this.providers.values()].map(({ provider }) => provider)),
    ];
    this.providers.clear();
    await Promise.all(providers.map((provider) => provider.dispose()));
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
