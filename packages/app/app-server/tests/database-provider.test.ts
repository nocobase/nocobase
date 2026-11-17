import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { AppConfig } from '../src/config/index.js';
import {
  databaseManagerToken,
  type DatabaseDriverDefinition,
  type DatabaseManager,
} from '@nocobase/db';
import {
  ServiceContainer,
  ServiceProviderRegistry,
} from '@nocobase/service-provider';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createDatabaseManagerMock = vi.hoisted(() => vi.fn());
const createDatabaseMigratorMock = vi.hoisted(() => vi.fn());
const createDatabaseSeederMock = vi.hoisted(() => vi.fn());

vi.mock('@nocobase/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/db')>();

  return {
    ...actual,
    createDatabaseManager: createDatabaseManagerMock,
    createMigrator: createDatabaseMigratorMock,
    createSeeder: createDatabaseSeederMock,
  };
});

import {
  databaseTaskHooksToken,
  DatabaseProvider,
  databaseTaskCoordinatorToken,
  type AppDatabaseConfig,
  type AppDatabaseTaskContributions,
  runAppMigrations,
  runAppSeeds,
  type DatabaseProviderApplication,
} from '../src/database/index.js';

/** An application that registered no server plugins. */
const contributions: AppDatabaseTaskContributions = {
  appPackageName: 'app',
  migrations: [],
  seeds: [],
};

const tempDirs: string[] = [];
/**
 * A stand-in driver whose database is a local file, which is the case where
 * the provider has storage to prepare. The Database Manager is mocked, so no
 * real driver is involved and no database is opened.
 */
const localFileDriver: DatabaseDriverDefinition<'local-file'> = {
  dialect: 'local-file',
  prepareStorage: async (source, context) => {
    const filename = (source as { filename?: string }).filename;
    if (!filename) return;
    await context.ensureDirectory(path.dirname(filename));
  },
};

beforeEach(() => {
  createDatabaseManagerMock.mockReset();
  createDatabaseMigratorMock.mockReset();
  createDatabaseSeederMock.mockReset();
});

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('DatabaseProvider', () => {
  it('registers a lazy database manager created from runtime config', async () => {
    const database = createMockDatabase();
    createDatabaseManagerMock.mockReturnValue(database);
    const { provider, container } = await createProvider(createConfig());

    provider.register();

    expect(provider.name).toBe('@nocobase/app-server/database');
    expect(container.resolveIfCreated(databaseManagerToken)).toBeUndefined();
    expect(container.resolve(databaseManagerToken)).toBe(database);
    expect(createDatabaseManagerMock).toHaveBeenCalledOnce();
  });

  it('does not register a database when the default connection is none', async () => {
    const { provider, container } = await createProvider({
      ...createConfig(),
      default: 'none',
      connections: {},
    });

    provider.register();

    expect(container.has(databaseManagerToken)).toBe(false);
  });

  it('prepares storage, runs migrations before seeds, and destroys the database', async () => {
    const calls: string[] = [];
    const root = createTempDirectory();
    const database = createMockDatabase(() => calls.push('destroy'));
    createDatabaseManagerMock.mockReturnValue(database);
    createDatabaseMigratorMock.mockReturnValue({
      latest: vi.fn(async () => {
        calls.push('migrate');
        return { batch: 1, executed: [], skipped: [] };
      }),
      rollback: vi.fn(),
      history: vi.fn(async () => []),
    });
    createDatabaseSeederMock.mockReturnValue({
      run: vi.fn(async () => {
        calls.push('seed');
        return { executed: [], skipped: [], skippedSamples: [] };
      }),
      history: vi.fn(async () => []),
      record: vi.fn(),
    });
    const config = createConfig(root, true);
    const { provider, container } = await createProvider(config);
    const registry = new ServiceProviderRegistry();
    registry.add(provider);
    registry.registerAll();

    await registry.bootAll();
    await registry.shutdown();

    expect(existsSync(path.dirname(config.connections.main.filename))).toBe(
      true,
    );
    expect(calls).toEqual(['migrate', 'seed', 'destroy']);
    expect(container.resolveIfCreated(databaseManagerToken)).toBe(database);
  });

  it('passes all named source contributions to the startup coordinator even when their tasks are skipped', async () => {
    const root = createTempDirectory();
    createDatabaseManagerMock.mockReturnValue(createMockDatabase());
    const inventory: AppDatabaseTaskContributions = {
      ...contributions,
      connections: {
        audit: {
          migrations: [
            { packageName: '@acme/app-module-audit', directory: root },
          ],
          seeds: [],
        },
      },
    };
    const config = createConfig(root, true);
    const { provider, container } = await createProvider(
      {
        ...config,
        connections: {
          ...config.connections,
          audit: {
            dialect: 'local-file',
            filename: path.join(root, 'audit.db'),
            migrations: { autoRun: false },
            seeds: { autoRun: false },
          },
        },
      },
      inventory,
    );
    const coordinate = vi.fn(
      async (
        context: import('../src/database/index.js').AppDatabaseTaskCoordinatorContext,
      ) => {
        expect(context.options.contributions).toBe(inventory);
        expect(
          context.plan
            .filter((task) => task.connection === 'audit')
            .every((task) => task.skipReason),
        ).toBe(true);
        return { ok: true, status: 'completed' as const, results: [] };
      },
    );
    container.singleton(databaseTaskCoordinatorToken, () => coordinate);
    provider.register();
    await provider.boot();
    expect(coordinate).toHaveBeenCalledOnce();
    await provider.shutdown();
  });

  it('does not run automatic tasks when autoRun is disabled', async () => {
    const database = createMockDatabase();
    createDatabaseManagerMock.mockReturnValue(database);
    const { provider } = await createProvider(createConfig());

    provider.register();
    await provider.boot();
    await provider.shutdown();

    expect(createDatabaseMigratorMock).not.toHaveBeenCalled();
    expect(createDatabaseSeederMock).not.toHaveBeenCalled();
    expect(database.destroy).toHaveBeenCalledOnce();
  });

  it('stops before seeds and destroys the database when migrations fail', async () => {
    const error = new Error('migration failed');
    const database = createMockDatabase();
    createDatabaseManagerMock.mockReturnValue(database);
    createDatabaseMigratorMock.mockReturnValue({
      latest: vi.fn().mockRejectedValue(error),
      rollback: vi.fn(),
      history: vi.fn(async () => []),
    });
    const seed = vi.fn();
    createDatabaseSeederMock.mockReturnValue({
      run: seed,
      history: vi.fn(async () => []),
    });
    const { provider } = await createProvider(
      createConfig(createTempDirectory(), true),
    );
    const registry = new ServiceProviderRegistry();
    registry.add(provider);
    registry.registerAll();

    await expect(registry.bootAll()).rejects.toMatchObject({ cause: error });

    expect(seed).not.toHaveBeenCalled();
    expect(database.destroy).toHaveBeenCalledOnce();
  });
  it('registers hooks without creating a manager and prepares runtime-only storage exactly once', async () => {
    const config = createConfig(createTempDirectory(), true);
    const prepare = vi.fn(localFileDriver.prepareStorage);
    config.drivers = {
      'local-file': { ...localFileDriver, prepareStorage: prepare },
    };
    config.connections.other = {
      dialect: 'local-file',
      filename: path.join(createTempDirectory(), 'other', 'data.db'),
      migrations: { autoRun: false },
      seeds: { autoRun: false },
    };
    createDatabaseManagerMock.mockReturnValue(createMockDatabase());
    createDatabaseMigratorMock.mockReturnValue({
      latest: async () => ({ batch: 1, executed: [], skipped: [] }),
      history: async () => [],
    });
    createDatabaseSeederMock.mockReturnValue({
      run: async () => ({ executed: [], skipped: [], skippedSamples: [] }),
      history: async () => [],
      record: async () => {},
    });
    const { provider, container } = await createProvider(config);
    provider.register();
    expect(container.has(databaseTaskHooksToken)).toBe(true);
    expect(createDatabaseManagerMock).not.toHaveBeenCalled();
    const beforeTasks = vi.fn(async () => {});
    container
      .resolve(databaseTaskHooksToken)
      .register({ name: 'runtime', beforeTasks });
    expect(beforeTasks).not.toHaveBeenCalled();
    try {
      await provider.boot();
      expect(prepare).toHaveBeenCalledTimes(2);
      expect(beforeTasks).toHaveBeenCalledOnce();
    } finally {
      await provider.shutdown();
    }
  });

  it('shuts registered dependents down before the database after a hook fails during boot', async () => {
    const events: string[] = [];
    createDatabaseManagerMock.mockReturnValue(
      createMockDatabase(() => events.push('database')),
    );
    const { provider, container } = await createProvider(
      createConfig(createTempDirectory(), true),
    );
    const registry = new ServiceProviderRegistry();
    registry.add(provider);
    registry.add({
      name: 'dependent',
      register() {
        container.resolve(databaseTaskHooksToken).register({
          name: 'fail',
          async beforeTasks() {
            throw new Error('hook failed');
          },
        });
      },
      async boot() {},
      async start() {},
      async ready() {},
      async shutdown() {
        events.push('dependent');
      },
    });
    registry.registerAll();
    await expect(registry.bootAll()).rejects.toMatchObject({
      preparation: { phase: 'beforeTasks', hook: 'fail' },
    });
    expect(events).toEqual(['dependent', 'database']);
  });
});

describe('standalone database tasks', () => {
  it('runs manual migrations and always destroys their database', async () => {
    const error = new Error('migration failed');
    const database = createMockDatabase();
    createDatabaseManagerMock.mockReturnValue(database);
    createDatabaseMigratorMock.mockReturnValue({
      latest: vi.fn().mockRejectedValue(error),
      rollback: vi.fn(),
    });

    await expect(
      runAppMigrations(createConfig(createTempDirectory()), { contributions }),
    ).rejects.toMatchObject({ cause: error });
    expect(database.destroy).toHaveBeenCalledOnce();
  });

  it('runs manual seeds even when autoRun is disabled', async () => {
    const database = createMockDatabase();
    createDatabaseManagerMock.mockReturnValue(database);
    createDatabaseSeederMock.mockReturnValue({
      run: vi.fn().mockResolvedValue({
        executed: ['seed'],
        skipped: [],
        skippedSamples: [],
      }),
      history: vi.fn(async () => []),
    });

    await expect(
      runAppSeeds(createConfig(createTempDirectory()), { contributions }),
    ).resolves.toEqual({
      status: 'completed',
      executed: ['seed'],
      skipped: [],
    });
    expect(database.destroy).toHaveBeenCalledOnce();
  });

  it('returns undefined when the requested database service is unavailable', async () => {
    const config = {
      ...createConfig(),
      default: 'none' as const,
      connections: {},
    };

    await expect(
      runAppMigrations(config, { contributions }),
    ).resolves.toBeUndefined();
    await expect(
      runAppSeeds({ ...config, seeds: undefined }, { contributions }),
    ).resolves.toBeUndefined();
  });
});

async function createProvider(
  database: AppDatabaseConfig,
  taskContributions = contributions,
): Promise<{
  readonly provider: DatabaseProvider<DatabaseProviderApplication>;
  readonly container: ServiceContainer;
}> {
  const container = new ServiceContainer();
  const appConfig = new AppConfig();
  await appConfig.loadAll();
  appConfig.mergeDefaults({ database });
  const app: DatabaseProviderApplication = {
    config: appConfig,
    container,
    databaseTaskContributions: taskContributions,
  };
  return {
    provider: new DatabaseProvider(app),
    container,
  };
}

function createConfig(
  root: string = '/tmp/nocobase-app-server',
  autoRun: boolean = false,
): AppDatabaseConfig & {
  connections: {
    main: { dialect: 'local-file'; filename: string };
  };
} {
  return {
    drivers: { 'local-file': localFileDriver },
    default: 'main',
    connections: {
      main: {
        dialect: 'local-file',
        filename: path.join(root, 'storage', 'database.db'),
      },
    },
    migrations: {
      directory: root,
      autoRun,
    },
    seeds: {
      directory: root,
      autoRun,
    },
  };
}

function createTempDirectory(): string {
  const directory = mkdtempSync(
    path.join(tmpdir(), 'nocobase-database-provider-'),
  );
  tempDirs.push(directory);
  return directory;
}

function createMockDatabase(onDestroy?: () => void): DatabaseManager {
  return {
    connection: vi.fn() as DatabaseManager['connection'],
    builder: vi.fn() as DatabaseManager['builder'],
    query: vi.fn() as DatabaseManager['query'],
    createMigrator: vi.fn() as DatabaseManager['createMigrator'],
    createSeeder: vi.fn() as DatabaseManager['createSeeder'],
    connect: vi.fn() as DatabaseManager['connect'],
    transaction: vi.fn() as DatabaseManager['transaction'],
    disconnect: vi.fn() as DatabaseManager['disconnect'],
    reconnect: vi.fn() as DatabaseManager['reconnect'],
    destroy: vi.fn(async () => {
      onDestroy?.();
    }),
  };
}
