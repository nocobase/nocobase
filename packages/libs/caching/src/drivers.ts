import { resolveTtlConfig } from './internal/duration.js';
import { MemoryCacheProvider } from './memory-provider.js';
import type {
  CacheProvider,
  CacheProviderConfig,
  CacheProviderDriver,
  CacheProviderDriverContext,
  MemoryCacheProviderConfig,
} from './types.js';

export const memoryCacheProviderDriver: CacheProviderDriver = {
  name: 'memory',
  createProvider(
    config: CacheProviderConfig,
    _context: CacheProviderDriverContext,
  ): CacheProvider {
    const memory = config as MemoryCacheProviderConfig;
    return new MemoryCacheProvider({
      maxSize: memory.maxSize,
      defaultTtl: resolveTtlConfig(
        memory.defaultTtl,
        'Memory cache defaultTtl',
      ),
      maxTtl: resolveTtlConfig(memory.maxTtl, 'Memory cache maxTtl'),
      checkInterval: resolveTtlConfig(
        memory.checkInterval,
        'Memory cache checkInterval',
      ),
      useClone: memory.useClone,
    });
  },
};
