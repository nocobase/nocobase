// db-test-portability: dialect-specific — type tests of each dialect's driver
import { expectTypeOf, it } from 'vitest';
import sqlite, {
  sqliteDriver,
  type SqliteConnectionConfig,
} from '@nocobase/db-sqlite';
import postgres, {
  postgresDriver,
  type PostgresConnectionConfig,
} from '@nocobase/db-postgres';
import type {
  BaseConnectionConfig,
  DatabaseDriverDefinition,
  DatabaseDriverFactory,
} from '@nocobase/db';
import { defineAppConfig } from '../../src/config/index.js';
import type { AppConfigFactory } from '../../src/config/index.js';
import type {
  AppDatabaseConfigFromDrivers,
  AppDatabaseConnectionConfig,
} from '../../src/database/index.js';
import {
  createAppDatabaseManager,
  prepareAppDatabaseStorage,
} from '../../src/database/index.js';

interface CustomConnection extends BaseConnectionConfig {
  dialect: 'custom';
  endpoint: string;
}

it('accepts driver-owned fields at application runtime entry points', async () => {
  const database = createAppDatabaseManager({
    drivers: { sqlite },
    connections: { main: { dialect: 'sqlite', filename: ':memory:' } },
  });
  await prepareAppDatabaseStorage({
    drivers: { sqlite },
    connections: { main: { dialect: 'sqlite', filename: ':memory:' } },
  });
  await database?.destroy();
});

it('validates every driver key in explicitly annotated application configurations', () => {
  const drivers = { sqlite, pg: postgres };
  const invalid: AppDatabaseConfigFromDrivers<typeof drivers> = {
    // @ts-expect-error The unused postgres factory still cannot use the pg key.
    drivers,
    connections: { main: { dialect: 'sqlite', filename: ':memory:' } },
  };
  expectTypeOf(invalid.connections.main.dialect).toEqualTypeOf<'sqlite'>();

  const descriptors = { mysql: postgresDriver };
  const empty: AppDatabaseConfigFromDrivers<typeof descriptors> = {
    // @ts-expect-error Empty connections do not permit invalid descriptor keys.
    drivers: descriptors,
    connections: {},
  };
  expectTypeOf(empty.connections).toEqualTypeOf<Record<string, never>>();
});

it('infers the exact connection union from factories and descriptors', () => {
  const custom: DatabaseDriverDefinition<'custom', CustomConnection> = {
    dialect: 'custom',
  };
  const drivers = { sqlite, postgres, custom };
  type Config = AppDatabaseConfigFromDrivers<typeof drivers>;

  expectTypeOf<Config['connections'][string]>().toEqualTypeOf<
    AppDatabaseConnectionConfig<
      SqliteConnectionConfig | PostgresConnectionConfig | CustomConnection
    >
  >();
  expectTypeOf<
    AppDatabaseConfigFromDrivers<{
      sqlite: typeof sqliteDriver;
    }>['connections'][string]
  >().toEqualTypeOf<AppDatabaseConnectionConfig<SqliteConnectionConfig>>();
  expectTypeOf<
    AppDatabaseConfigFromDrivers<{
      custom: DatabaseDriverFactory<'custom', object, CustomConnection>;
    }>['connections'][string]
  >().toEqualTypeOf<AppDatabaseConnectionConfig<CustomConnection>>();

  const factory: AppConfigFactory<Config> = defineAppConfig(
    (runtime): Config => ({
      drivers,
      connections: {
        main: {
          dialect: 'sqlite',
          filename: runtime.paths.storage('main.sqlite'),
          metadataStore: 'database/main/collections',
          migrations: { autoRun: true },
          seeds: { autoRun: false },
        },
        reporting: { dialect: 'postgres', host: 'db.example.test' },
        custom: { dialect: 'custom', endpoint: 'db.example.test' },
        // @ts-expect-error The configuration factory rejects other dialects' fields too.
        invalid: { dialect: 'postgres', filename: 'app.sqlite' },
      },
    }),
  );
  expectTypeOf(factory).returns.toEqualTypeOf<Config>();

  const invalid: Config['connections'] = {
    // @ts-expect-error An installed but unregistered dialect is not accepted.
    unregistered: { dialect: 'mysql' },
    // @ts-expect-error SQLite still requires its filename.
    missingFilename: { dialect: 'sqlite' },
    // @ts-expect-error A contributed driver's required options are preserved.
    missingEndpoint: { dialect: 'custom' },
    // @ts-expect-error PostgreSQL must not accept SQLite fields.
    wrongField: { dialect: 'postgres', filename: 'app.sqlite' },
    // @ts-expect-error Option value types are preserved.
    wrongType: { dialect: 'postgres', port: '5432' },
  };
  expectTypeOf(invalid).toEqualTypeOf<Config['connections']>();
});

it('only accepts SQLite when it is the only registered driver', () => {
  type Config = AppDatabaseConfigFromDrivers<{ sqlite: typeof sqlite }>;
  expectTypeOf<
    Config['connections'][string]['dialect']
  >().toEqualTypeOf<'sqlite'>();
  expectTypeOf<
    AppDatabaseConfigFromDrivers<Record<never, never>>['connections'][string]
  >().toEqualTypeOf<never>();
});
