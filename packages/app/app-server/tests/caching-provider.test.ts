import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MemoryCacheProvider,
  type Cache,
  type CachingConfig,
} from '@nocobase/caching';
import { ServiceProvider } from '@nocobase/service-provider';
import { Application } from '../src/application/index.js';
import { AppConfig, createAppPaths } from '../src/config/index.js';
import { CachingProvider, cachingToken } from '../src/caching/index.js';

const apps: Application[] = [];
async function application(caching: CachingConfig): Promise<Application> {
  const config = new AppConfig();
  await config.loadAll();
  config.mergeDefaults({
    caching,
    app: {
      name: 'caching-test',
      publicBasePath: '',
      internalBasePath: '',
      publicApiUrl: '/api',
    },
  });
  const app = new Application({
    config,
    paths: createAppPaths({ rootDir: import.meta.dirname }),
  });
  app.addServiceProvider(CachingProvider);
  apps.push(app);
  return app;
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.shutdown()));
});

class DriverContribution extends ServiceProvider<Application> {
  public readonly name: string = 'test-caching-driver';
  public override register(): void {
    this.app.container.resolve(cachingToken).registerDriver({
      name: 'remote',
      createProvider: () => new MemoryCacheProvider(),
    });
  }
}

class CacheConsumer extends ServiceProvider<Application> {
  public readonly name: string = 'test-caching-consumer';
  public cache: Cache | undefined;
  public override async boot(): Promise<void> {
    this.cache = this.app.container
      .resolve(cachingToken)
      .getCache({ namespace: 'shared' });
    await this.cache.set('boot', this.app.appName);
  }
}

const remote: CachingConfig = {
  default: 'shared',
  providers: { shared: { driver: 'remote' } },
};

describe('CachingProvider in real Applications', () => {
  it('accepts equal driver names in two Apps and keeps B operational after A shuts down', async () => {
    const a = await application(remote);
    const b = await application(remote);
    for (const app of [a, b]) {
      // The consumer is composed first, but every register precedes every boot.
      app.addServiceProvider(CacheConsumer);
      app.addServiceProvider(DriverContribution);
      await app.start();
    }
    const first = a.container
      .resolve(cachingToken)
      .getCache({ namespace: 'shared' });
    const second = b.container
      .resolve(cachingToken)
      .getCache({ namespace: 'shared' });
    await first.set('key', 'a');
    await second.set('key', 'b');
    await a.shutdown();
    await expect(first.get('key')).rejects.toThrow('closed');
    expect(await second.get('key')).toBe('b');
    await b.container
      .resolve(cachingToken)
      .getCache({ namespace: 'new-after-a' })
      .set('key', true);
    const restarted = await application(remote);
    restarted.addServiceProvider(DriverContribution);
    await restarted.start();
  });

  it('starts with Memory and an unused unavailable Redis definition without creating an unused contributed provider', async () => {
    const createProvider = vi.fn(() => new MemoryCacheProvider());
    const app = await application({
      default: 'memory',
      providers: {
        memory: { driver: 'memory' },
        redis: { driver: 'redis', connection: 'invalid-but-unused' },
        spare: { driver: 'unused' },
      },
    });
    class UnusedContribution extends ServiceProvider<Application> {
      public readonly name: string = 'unused-driver';
      public override register(): void {
        this.app.container
          .resolve(cachingToken)
          .registerDriver({ name: 'unused', createProvider });
      }
    }
    app.addServiceProvider(UnusedContribution);
    await app.start();
    expect(createProvider).not.toHaveBeenCalled();
    const caching = app.container.resolve(cachingToken);
    await caching.getCache({ namespace: 'local' }).set('key', 1);
    expect(() =>
      caching.getCache({ namespace: 'redis', provider: 'redis' }),
    ).toThrow('not registered');
    expect(() =>
      caching.getCache({ namespace: 'missing', provider: 'missing' }),
    ).toThrow('not configured');
  });

  it('fails boot for a selected missing driver before any consumer can start', async () => {
    const started = vi.fn();
    class Consumer extends ServiceProvider<Application> {
      public readonly name: string = 'start-observer';
      public override async start(): Promise<void> {
        started();
      }
    }
    const app = await application(remote);
    app.addServiceProvider(Consumer);
    await expect(app.start()).rejects.toThrow('not registered');
    expect(started).not.toHaveBeenCalled();
  });
});
