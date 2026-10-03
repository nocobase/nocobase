// db-test-portability: dialect-specific — type tests of each dialect's configuration factory
import { expect, expectTypeOf, it, vi } from 'vitest';
import sqlite from '@nocobase/db-sqlite';
import postgres, { postgresDriver } from '@nocobase/db-postgres';
import mysql from '@nocobase/db-mysql';
import type {
  BaseConnectionConfig,
  DatabaseDriverDefinition,
} from '@nocobase/db';
import {
  createAppPaths,
  type AppConfigFactory,
} from '../../src/config/index.js';
import {
  defineAppDatabaseConfig,
  type AppDatabaseConfig,
} from '../../src/database/index.js';
import type { AppRuntimeContext } from '../../src/runtime/definition.js';

interface CustomConnection extends BaseConnectionConfig {
  dialect: 'custom';
  endpoint: string;
}

const custom: DatabaseDriverDefinition<'custom', CustomConnection> = {
  dialect: 'custom',
};

it('infers returned drivers and evaluates the configuration only when invoked', () => {
  const called = vi.fn();
  const factory = defineAppDatabaseConfig((runtime) => {
    called();
    return {
      drivers: { sqlite, postgres, custom, mysql },
      default: 'main',
      connections: {
        main: {
          dialect: 'sqlite',
          filename: runtime.paths.storage('database.sqlite'),
          metadataStore: 'database/main/collections',
          migrations: { autoRun: false },
          seeds: { autoRun: true },
        },
        reporting: { dialect: 'postgres', host: 'localhost', port: 5432 },
        custom: { dialect: 'custom', endpoint: 'localhost' },
        socket: { dialect: 'mysql', socketPath: '/tmp/mysql.sock' },
      },
    };
  });
  expectTypeOf(factory).toEqualTypeOf<AppConfigFactory<AppDatabaseConfig>>();
  expect(called).not.toHaveBeenCalled();
  const paths = createAppPaths({ rootDir: '/tmp/database-config-factory' });
  // Only the path service is used by this callback.
  const runtime = { paths: paths } as AppRuntimeContext;
  const config = factory(runtime);
  expect(called).toHaveBeenCalledOnce();
  expect(config.drivers?.sqlite).toBe(sqlite);
  expect(config.connections.main).toMatchObject({
    filename: paths.storage('database.sqlite'),
    migrations: { autoRun: false },
  });
});

it('rejects driver aliases independently of the configured connections', () => {
  defineAppDatabaseConfig(() => ({
    // @ts-expect-error Unused drivers must also use their declared dialect as the key.
    drivers: { sqlite, pg: postgres },
    connections: { main: { dialect: 'sqlite', filename: ':memory:' } },
  }));
  defineAppDatabaseConfig(() => ({
    // @ts-expect-error Empty connections must not allow an alias key.
    drivers: { pg: postgres },
    connections: {},
  }));
  defineAppDatabaseConfig(() => ({
    // @ts-expect-error The driver descriptor declares postgres, not mysql.
    drivers: { mysql: postgresDriver },
    connections: {},
  }));
  defineAppDatabaseConfig(() => ({
    // @ts-expect-error Contributed drivers also require their declared dialect.
    drivers: { other: custom },
    connections: {},
  }));
  const drivers = { sqlite, pg: postgres };
  defineAppDatabaseConfig(() => ({
    // @ts-expect-error A separately declared registration map must be checked too.
    drivers,
    connections: { main: { dialect: 'sqlite', filename: ':memory:' } },
  }));
});

it('accepts canonical driver keys independently of local import names', () => {
  const pg = postgres;
  const drivers = { sqlite, postgres: pg, custom } as const;
  const factory = defineAppDatabaseConfig(() => ({
    drivers,
    connections: {
      main: { dialect: 'postgres', host: 'localhost' },
      custom: { dialect: 'custom', endpoint: 'db.example.test' },
    },
  }));
  expectTypeOf(factory).toEqualTypeOf<AppConfigFactory<AppDatabaseConfig>>();

  const descriptorFactory = defineAppDatabaseConfig(() => ({
    drivers: { postgres: postgresDriver },
    connections: {},
  }));
  expectTypeOf(descriptorFactory).toEqualTypeOf<
    AppConfigFactory<AppDatabaseConfig>
  >();
});

it('rejects missing, unrelated, and incorrectly typed connection fields', () => {
  defineAppDatabaseConfig(() => ({
    drivers: { sqlite },
    // @ts-expect-error SQLite requires its filename.
    connections: { main: { dialect: 'sqlite' } },
  }));
  defineAppDatabaseConfig(() => ({
    drivers: { sqlite },
    // @ts-expect-error Only registered dialects may be configured.
    connections: { main: { dialect: 'postgres' } },
  }));
  // @ts-expect-error SQLite does not have a host option.
  defineAppDatabaseConfig(() => ({
    drivers: { sqlite },
    connections: {
      main: {
        dialect: 'sqlite',
        filename: ':memory:',
        host: 'localhost',
      },
    },
  }));
  // @ts-expect-error Driver option value types are preserved.
  defineAppDatabaseConfig(() => ({
    drivers: { postgres },
    connections: { main: { dialect: 'postgres', port: '5432' } },
  }));
  defineAppDatabaseConfig(() => ({
    drivers: { custom },
    // @ts-expect-error Third-party connection fields remain required.
    connections: { main: { dialect: 'custom' } },
  }));
  // @ts-expect-error Host and socket targets are mutually exclusive.
  defineAppDatabaseConfig(() => ({
    drivers: { mysql },
    connections: {
      main: {
        dialect: 'mysql',
        host: 'localhost',
        socketPath: '/tmp/mysql.sock',
      },
    },
  }));
  // @ts-expect-error Unknown top-level configuration fields are rejected.
  defineAppDatabaseConfig(() => ({
    drivers: { sqlite },
    connections: {},
    typo: true,
  }));
});

it('accepts installed official drivers without explicit runtime imports', () => {
  const factory = defineAppDatabaseConfig(() => ({
    connections: {
      main: { dialect: 'mysql', database: 'app', port: 3306 },
      cache: { dialect: 'sqlite', filename: ':memory:' },
    },
  }));
  expectTypeOf(factory).toEqualTypeOf<AppConfigFactory<AppDatabaseConfig>>();
});
