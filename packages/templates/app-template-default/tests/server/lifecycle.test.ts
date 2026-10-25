import { describe, expect, it, vi } from 'vitest';

import {
  RealtimeProvider,
  realtimeServiceToken,
} from '@nocobase/app-server/realtime';
import {
  ServiceContainer,
  ServiceProviderRegistry,
} from '@nocobase/service-provider';
import { createDefaultCachingConfig } from '@nocobase/caching';
import { CachingProvider, cachingToken } from '@nocobase/app-server/caching';
import type { AppConfigAccessor } from '@nocobase/app-server/config';
import { DriveProvider, driveManagerToken } from '@nocobase/app-server/drive';
import {
  IdGeneratorProvider,
  idGeneratorToken,
} from '@nocobase/app-server/id-generator';
import { LoggingProvider, loggingToken } from '@nocobase/app-server/logging';
import {
  QueueServiceProvider,
  queueServiceToken,
} from '@nocobase/app-server/queue';
import {
  SessionProvider,
  sessionManagerToken,
} from '@nocobase/app-server/session';
import { createNullSessionConfig } from '@nocobase/session';
import { databaseManagerToken, type DatabaseManager } from '@nocobase/db';

describe('app service providers', () => {
  it('registers core services and shuts them down in reverse order', async () => {
    const services = new ServiceContainer();
    const registry = new ServiceProviderRegistry();
    const app = createProviderApplication(
      {
        caching: createDefaultCachingConfig(),
        drive: {
          default: 'local',
          disks: {
            local: {
              driver: 'fs',
              location: process.cwd(),
              visibility: 'private',
            },
          },
        },
        logging: {
          enabled: false,
          level: 'silent',
        },
        queue: {
          default: 'memory',
          memory: { adapter: 'inMemory' },
        },
        session: createNullSessionConfig(),
        snowflake: {
          workerId: 0,
        },
      },
      services,
    );
    registry.add(new LoggingProvider(app));
    registry.add(new CachingProvider(app));
    registry.add(new IdGeneratorProvider(app));
    registry.add(new SessionProvider(app));
    registry.add(new DriveProvider(app));
    registry.add(new QueueServiceProvider(app));
    registry.add(new RealtimeProvider(app));

    registry.registerAll();
    const logging = services.resolve(loggingToken);
    const caching = services.resolve(cachingToken);
    const idGenerator = services.resolve(idGeneratorToken);
    const sessionManager = services.resolve(sessionManagerToken);
    const queue = services.resolve(queueServiceToken);
    const realtime = services.resolve(realtimeServiceToken);
    const closeLogging = vi.spyOn(logging, 'close');
    const dispose = vi.spyOn(caching, 'dispose');
    const disposeSession = vi.spyOn(sessionManager, 'dispose');
    const closeQueue = vi.spyOn(queue, 'shutdown');
    const closeRealtime = vi.spyOn(realtime, 'close');

    await registry.shutdown();

    expect(services.resolve(idGeneratorToken)).toBe(idGenerator);
    expect(services.has(driveManagerToken)).toBe(true);
    expect(closeRealtime).toHaveBeenCalledOnce();
    expect(closeQueue).toHaveBeenCalledOnce();
    expect(disposeSession).toHaveBeenCalledOnce();
    expect(dispose).toHaveBeenCalledOnce();
    expect(closeLogging).toHaveBeenCalledOnce();
    expect(disposeSession.mock.invocationCallOrder[0]).toBeLessThan(
      dispose.mock.invocationCallOrder[0],
    );
    expect(closeQueue.mock.invocationCallOrder[0]).toBeLessThan(
      disposeSession.mock.invocationCallOrder[0],
    );
    expect(closeRealtime.mock.invocationCallOrder[0]).toBeLessThan(
      closeQueue.mock.invocationCallOrder[0],
    );
    expect(dispose.mock.invocationCallOrder[0]).toBeLessThan(
      closeLogging.mock.invocationCallOrder[0],
    );
  });

  it('registers and prepares drive only when configuration is available', async () => {
    const services = new ServiceContainer();
    const registry = new ServiceProviderRegistry();
    registry.add(
      new DriveProvider({
        config: createTestConfig({
          drive: {
            default: 'public',
            disks: {
              public: {
                driver: 'fs',
                location: process.cwd(),
                visibility: 'public',
              },
            },
          },
        }),
        container: services,
      }),
    );

    registry.registerAll();
    await registry.bootAll();

    expect(services.has(driveManagerToken)).toBe(true);
    expect(services.resolve(driveManagerToken)).toBeDefined();
  });

  it('resolves authentication, authorization, and queue provider dependencies', async () => {
    const services = new ServiceContainer();
    const registry = new ServiceProviderRegistry();
    const connection = { kind: 'connection' };
    const database = {
      connection: vi.fn(() => connection),
      destroy: vi.fn(() => Promise.resolve()),
    } as unknown as DatabaseManager;
    const queueConfig = {
      default: 'test',
      test: { adapter: 'inMemory' as const },
    };
    const app = createProviderApplication(
      {
        database: createDatabaseConfig(),
        app: {
          name: 'provider-test',
          publicOrigin: 'https://example.com',
          publicBasePath: '/provider-test',
        },
        auth: {
          secret: 'test-auth-secret-at-least-32-characters',
        },
        caching: createDefaultCachingConfig(),
        logging: {
          enabled: false,
          level: 'silent',
        },
        queue: queueConfig,
        snowflake: {
          workerId: 0,
        },
      },
      services,
    );
    services.instance(databaseManagerToken, database);
    registry.add(new LoggingProvider(app));
    registry.add(new CachingProvider(app));
    registry.add(new IdGeneratorProvider(app));
    registry.add(new QueueServiceProvider(app));

    registry.registerAll();
    services.resolve(queueServiceToken);

    expect(services.resolve(databaseManagerToken)).toBe(database);
    await registry.shutdown();
  });
});

function createProviderApplication(
  values: Readonly<Record<string, unknown>>,
  container: ServiceContainer,
): {
  appName: string;
  paths: { storage: (...segments: string[]) => string };
  config: AppConfigAccessor;
  container: ServiceContainer;
} {
  return {
    appName: 'provider-test',
    paths: { storage: (...segments: string[]) => segments.join('/') },
    config: createTestConfig(values),
    container,
  };
}

function createTestConfig(
  values: Readonly<Record<string, unknown>>,
): AppConfigAccessor {
  return {
    get: <TValue>(definition: string): TValue => values[definition] as TValue,
    raw: () => values,
    reload: () => Promise.resolve({ changedNamespaces: [] }),
    subscribe: () => () => undefined,
  };
}

function createDatabaseConfig(): object {
  return {
    default: 'main',
    connections: {},
    migrations: {
      directory: '',
      autoRun: false,
    },
  };
}
