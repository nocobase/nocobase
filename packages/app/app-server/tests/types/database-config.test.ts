// db-test-portability: dialect-specific — type tests of dialect-contributed connection shapes
import { describe, expect, expectTypeOf, it } from 'vitest';

import type { BaseConnectionConfig, ConnectionConfig } from '@nocobase/db';
import type { SqliteConnectionConfig } from '@nocobase/db-sqlite';

import type {
  AppDatabaseConfig,
  AppDatabaseConnectionConfig,
} from '../../src/database/index.js';

/**
 * A dialect contributed by a package `@nocobase/db` knows nothing about, which is what
 * `@nocobase/db-kingbase`, `@nocobase/db-oceanbase` and `@nocobase/db-dameng` each are. Declared here rather than
 * imported so the contract is tested without this package depending on a dialect.
 *
 * Built the way those packages build theirs — a full connection config, an `Options` type that removes what the
 * registration supplies, and the dialect put back by the application — so this covers the shape an application
 * actually writes rather than a convenient approximation of it.
 */
interface ContributedConnectionConfig extends BaseConnectionConfig {
  dialect: 'cockroach';
  driver?: string;
  host?: string;
  port?: number;
}

type ContributedOptions = Omit<
  ContributedConnectionConfig,
  'dialect' | 'driver' | 'databaseDriver'
>;

type ContributedConnection = ContributedOptions & { dialect: 'cockroach' };

describe('AppDatabaseConfig', () => {
  /** Runtime consumers share a dialect-independent contract. */
  it('defaults to a dialect-independent connection contract', () => {
    const config: AppDatabaseConfig = {
      default: 'main',
      connections: {
        main: {
          dialect: 'custom',
          migrations: { autoRun: true },
        },
      },
    };

    expect(config.connections.main.dialect).toBe('custom');
    expectTypeOf<AppDatabaseConfig>().toMatchTypeOf<
      AppDatabaseConfig<ConnectionConfig>
    >();
  });

  /**
   * The runtime resolves a driver by name, so a contributed dialect has always worked once registered. Before this
   * parameter existed the type could not say so, and configuring one needed an assertion.
   */
  it('accepts a connection shape contributed by a dialect package', () => {
    const config: AppDatabaseConfig<
      SqliteConnectionConfig | ContributedConnection
    > = {
      default: 'main',
      connections: {
        main: { dialect: 'cockroach', host: 'db.example.test', port: 26257 },
        cache: { dialect: 'sqlite', filename: 'cache.sqlite' },
      },
    };

    expect(config.connections.main.dialect).toBe('cockroach');
    expect(config.connections.cache.dialect).toBe('sqlite');
  });

  /** Application task settings reach a contributed connection the same way they reach a built-in one. */
  it('carries migration and seed settings onto a contributed connection', () => {
    const connection: AppDatabaseConnectionConfig<ContributedConnection> = {
      dialect: 'cockroach',
      host: 'db.example.test',
      seeds: { autoRun: false },
    };

    expect(connection.seeds?.autoRun).toBe(false);
  });

  /**
   * Widening is per configuration and per dialect. Naming a contributed shape must not turn the others into
   * `BaseConnectionConfig & { dialect: string }`, which would accept any field on any dialect.
   */
  it('keeps every other dialect as strict as it was', () => {
    expectTypeOf<{
      dialect: 'cockroach';
      host: string;
    }>().not.toMatchTypeOf<
      AppDatabaseConnectionConfig<SqliteConnectionConfig>
    >();

    expectTypeOf<{ dialect: 'sqlite' }>().not.toMatchTypeOf<
      AppDatabaseConnectionConfig<
        SqliteConnectionConfig | ContributedConnection
      >
    >();

    expectTypeOf<{
      dialect: 'postgres';
      serviceName: string;
    }>().not.toMatchTypeOf<
      AppDatabaseConnectionConfig<
        SqliteConnectionConfig | ContributedConnection
      >
    >();
  });
});
