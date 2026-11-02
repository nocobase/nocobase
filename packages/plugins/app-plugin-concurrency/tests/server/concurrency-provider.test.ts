import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ConcurrentAcquireError,
  ConcurrentAbortError,
} from '@nocobase/concurrency';
import { ServiceProvider } from '@nocobase/service-provider';
import { Hono } from 'hono';
import {
  defineServerPlugins,
  resolveAppServerPlugins,
} from '@nocobase/app-server/plugins';
import { defineRootRoutes } from '@nocobase/app-server/router';
import { Application } from '@nocobase/app-server/application';
import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import concurrencyPlugin, {
  ConcurrencyServiceProvider,
  concurrencyServiceToken,
  type ConcurrencyService,
} from '../../server/index.js';

const applications: Application<AppConfig>[] = [];
const directories: string[] = [];
afterEach(async () => {
  for (const app of applications.splice(0)) await app.shutdown();
  for (const directory of directories.splice(0))
    await rm(directory, { recursive: true, force: true });
  vi.restoreAllMocks();
});
async function application(concurrency?: unknown) {
  const rootDir = await mkdtemp(path.join(tmpdir(), 'concurrency-app-'));
  directories.push(rootDir);
  const config = new AppConfig();
  await config.loadAll();
  config.mergeDefaults({
    app: {
      name: 'crm',
      publicBasePath: '/crm',
      internalBasePath: '',
      publicApiUrl: '/crm/api',
    },
    ...(concurrency === undefined ? {} : { concurrency }),
  });
  const app = new Application({
    config,
    paths: createAppPaths({ rootDir }),
    nodeEnv: 'development',
  });
  applications.push(app);
  app.addServerPlugins(
    resolveAppServerPlugins(rootDir, defineServerPlugins([concurrencyPlugin])),
  );
  return app;
}
describe('host concurrency provider in a real Application', () => {
  it('allows route factories to resolve the token but rejects acquisition until start completes', async () => {
    const app = await application();
    let checked: Promise<void> | undefined;
    app.addRoutes(
      defineRootRoutes(() => {
        const service = app.container.resolve(concurrencyServiceToken);
        checked = service.getManager().then(
          () => {
            throw new Error('Routes are composed before concurrency starts.');
          },
          (error: unknown) => {
            expect(error).toBeInstanceOf(ConcurrentAcquireError);
          },
        );
        return new Hono();
      }),
    );
    await app.start();
    expect(checked).toBeDefined();
    await checked;
    await expect(
      app.container.resolve(concurrencyServiceToken).getManager(),
    ).resolves.toBeDefined();
  });
  it('injects the original token into two consumers that contend with Lock and Executor', async () => {
    const app = await application({
      default: 'memory',
      memory: { adapter: 'mutex' },
    });
    const references: ConcurrencyService[] = [];
    class First extends ServiceProvider<Application<AppConfig>> {
      public readonly name = 'first-business';
      public override boot(): Promise<void> {
        const service = this.app.container.resolve(concurrencyServiceToken);
        references.push(service);
        return expect(service.getManager())
          .rejects.toBeInstanceOf(ConcurrentAcquireError)
          .then(() => {});
      }
    }
    class Second extends ServiceProvider<Application<AppConfig>> {
      public readonly name = 'second-business';
      public override boot(): Promise<void> {
        references.push(this.app.container.resolve(concurrencyServiceToken));
        return Promise.resolve();
      }
    }
    app.addServiceProvider(First);
    app.addServiceProvider(Second);
    expect(app.registeredServerPlugins).toMatchObject([
      {
        packageName: '@nocobase/app-plugin-concurrency',
        contributions: { serviceProviders: 1 },
      },
    ]);
    expect(app.container.has(concurrencyServiceToken)).toBe(false);
    await app.start();
    expect(references[0]).toBe(references[1]);
    const [one, two] = await Promise.all([
      references[0]!.getManager(),
      references[1]!.getManager('memory'),
    ]);
    expect(one).toBe(two);
    const lock = await one.createLock('orders:sync');
    const executor = await two.createSynchronous('orders:sync');
    const lease = await lock.lock();
    try {
      const runner = vi.fn();
      expect(await executor.tryRun(runner)).toEqual({ acquired: false });
      expect(runner).not.toHaveBeenCalled();
    } finally {
      await lease.release();
    }
    expect(await executor.tryRun(() => 42)).toEqual({
      acquired: true,
      value: 42,
    });
    await app.shutdown();
    await expect(references[0]!.getManager()).rejects.toBeInstanceOf(
      ConcurrentAbortError,
    );
  });
  it('supports no section and warns once outside development even for explicit memory', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const value of [
      undefined,
      { default: 'memory', memory: { adapter: 'mutex' } },
    ]) {
      const app = await application(value);
      // The provider's explicit option uses the application's deployment environment, not global process.env.
      const config = app.config;
      const production = new Application({
        config,
        paths: app.paths,
        nodeEnv: 'production',
      });
      applications.push(production);
      production.addServiceProvider(ConcurrencyServiceProvider);
      await production.start();
      const service = production.container.resolve(concurrencyServiceToken);
      await service.getManager();
      await service.getManager();
      await production.shutdown();
    }
    expect(warn).toHaveBeenCalledTimes(2);
    expect(
      warn.mock.calls.every(([message]) =>
        String(message).includes('local to this application process'),
      ),
    ).toBe(true);
  });
});
