import { describe, expect, it, vi } from 'vitest';
import { MemoryCacheProvider } from '@nocobase/caching';
import { ServiceProvider } from '@nocobase/service-provider';
import { Application } from '../src/application/index.js';
import { AppConfig, createAppPaths } from '../src/config/index.js';
import { CachingProvider, cachingToken } from '../src/caching/index.js';

async function appWithCaching(defaultName: string): Promise<Application> {
  const config = new AppConfig();
  await config.loadAll();
  config.mergeDefaults({
    caching: {
      default: defaultName,
      providers: { memory: { driver: 'memory' }, shared: { driver: 'custom' } },
    },
  });
  const app = new Application({
    config,
    paths: createAppPaths({ rootDir: '/test/caching' }),
  });
  app.addServiceProvider(CachingProvider);
  return app;
}

describe('CachingProvider lazy driver resolution', () => {
  it('leaves caching uncreated at boot and rejects a missing driver only on first use', async () => {
    const memory = await appWithCaching('memory');
    const missing = await appWithCaching('shared');
    try {
      await memory.start();
      await missing.start();
      expect(memory.container.resolveIfCreated(cachingToken)).toBeUndefined();
      expect(missing.container.resolveIfCreated(cachingToken)).toBeUndefined();
      const caching = missing.container.resolve(cachingToken);
      expect(() => caching.getCache({ namespace: 'x' })).toThrow(
        'not registered',
      );
      expect(() => caching.getCounter({ namespace: 'x' })).toThrow(
        'not registered',
      );
      expect(() => caching.getBloomFilter({ namespace: 'x' })).toThrow(
        'not registered',
      );
      expect(() =>
        memory.container.resolve(cachingToken).getCache({ namespace: 'x' }),
      ).not.toThrow();
    } finally {
      await memory.shutdown();
      await missing.shutdown();
    }
  });

  it('registers after construction and isolates two actual applications without eager factories', async () => {
    const factory = vi.fn(() => new MemoryCacheProvider());
    class DriverProvider extends ServiceProvider<Application> {
      public readonly name: string = 'custom-driver';
      public override register(): void {
        this.app.container
          .resolve(cachingToken)
          .registerDriver({ name: 'custom', createProvider: factory });
      }
    }
    const a = await appWithCaching('shared');
    const b = await appWithCaching('shared');
    a.addServiceProvider(DriverProvider);
    b.addServiceProvider(DriverProvider);
    try {
      await a.start();
      await b.start();
      expect(factory).not.toHaveBeenCalled();
      const ca = a.container
        .resolve(cachingToken)
        .getCache({ namespace: 'same' });
      const cb = b.container
        .resolve(cachingToken)
        .getCache({ namespace: 'same' });
      await ca.set('key', 'a');
      expect(await cb.get('key')).toBeUndefined();
      expect(factory).toHaveBeenCalledTimes(2);
    } finally {
      await a.shutdown();
      await b.shutdown();
    }
  });
});
