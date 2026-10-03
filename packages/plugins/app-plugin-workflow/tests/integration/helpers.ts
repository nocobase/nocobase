import { fileURLToPath } from 'node:url';

import {
  createDatabaseManager,
  createMigrator,
  type DatabaseManager,
  type MigrationSource,
} from '@nocobase/db';
import {
  provisionTestDatabases,
  testDatabaseDialect,
  type TestDatabase,
} from '@nocobase/app-testing/server';

/**
 * The database these tests run against is the one `NOCOBASE_TEST_DB_DIALECT`
 * selects, SQLite when it is unset. PostgreSQL and MySQL are the ones that
 * convert a timestamp on the way in or out, which is where the defect these
 * tests cover came from; see `packages/libs/db-testing/README.md` for running
 * them against a local server.
 */
export function integrationDialect(): string {
  return testDatabaseDialect();
}

/** What a connection to the same database may differ in. */
export interface IntegrationConnectionOverrides {
  /**
   * mysql2's `timezone`, which decides which wall clock a bound `Date` is
   * stored as and which instant a stored wall clock is read back as.
   *
   * The engine no longer depends on it. It used to: binding a `Date` to
   * `DATETIME(3)` made the driver's zone part of the stored value, so a
   * deployment had to set `'Z'` and a host that did not was silently wrong.
   * The Repository formats these columns in SQL instead, so this is now only
   * here for the test that proves the reading does not move when it changes.
   */
  mysqlTimezone?: string;
}

export interface IntegrationDatabase {
  readonly database: DatabaseManager;
  /**
   * Another Database Manager over the same database, as a second process
   * would open it. It reads the same Collection metadata, which the database
   * itself stores.
   */
  open(overrides?: IntegrationConnectionOverrides): DatabaseManager;
  /** Applies the plugin's migrations, optionally stopping at a given one. */
  migrate(upTo?: string): Promise<void>;
  /** Closes every manager opened on it and drops the database. */
  destroy(): Promise<void>;
}

export const CREATE_MIGRATION = '202608200001_create_workflow_collections';
export const INSTANT_MIGRATION = '202609110001_workflow_instant_columns';

const sources: readonly MigrationSource[] = [
  {
    packageName: '@nocobase/app-plugin-workflow',
    directory: fileURLToPath(
      new URL('../../database/migrations', import.meta.url),
    ),
  },
];

/** An empty database of its own on the selected dialect. */
export async function startIntegrationDatabase(): Promise<IntegrationDatabase> {
  const databases = await provisionTestDatabases();
  let primary: TestDatabase;
  try {
    primary = await databases.open();
  } catch (error) {
    await databases.drop();
    throw error;
  }
  const opened: DatabaseManager[] = [];
  return {
    database: primary.database,
    open: (overrides = {}) => {
      const manager = createDatabaseManager({
        default: 'main',
        connections: {
          main: {
            ...databases.connectionConfig(),
            // Deliberately left at the driver default unless a test asks otherwise:
            // a connection option the engine needs in order to be correct is exactly
            // what this suite exists to show it no longer needs.
            ...(overrides.mysqlTimezone
              ? { timezone: overrides.mysqlTimezone }
              : {}),
          },
        },
      });
      opened.push(manager);
      return manager;
    },
    migrate: async (upTo) => {
      const migrator = createMigrator({ database: primary.database, sources });
      if (upTo) await migrator.upTo(upTo);
      else await migrator.latest();
    },
    destroy: async () => {
      try {
        for (const manager of opened) await manager.destroy();
        await primary.destroy();
      } finally {
        await databases.drop();
      }
    },
  };
}

/**
 * How the engine wrote a timestamp before it knew these columns were instants:
 * the canonical string, with nothing recording that it is UTC. MySQL rejects
 * the `T` and the `Z` outright, which is the shape it stored instead. Only the
 * migration test needs this, and it writes through the query builder because
 * that is what wrote the rows the migration has to convert.
 */
export function legacyTimestamp(instant: string): string {
  return integrationDialect() === 'mysql'
    ? `${instant.slice(0, 10)} ${instant.slice(11, 23)}`
    : instant;
}
