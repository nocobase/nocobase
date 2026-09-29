import type { SqliteConnectionConfig } from '@nocobase/db-sqlite';
import type { PostgresConnectionConfig } from '@nocobase/db-postgres';
import type { MysqlConnectionConfig } from '@nocobase/db-mysql';
import { fileURLToPath } from 'node:url';

import type { Knex } from 'knex';
import sqlite from '@nocobase/db-sqlite';
import postgres from '@nocobase/db-postgres';
import mysql from '@nocobase/db-mysql';

import {
  createDatabaseManager,
  InMemoryCollectionMetadataStore,
  type CollectionMetadataStore,
  type DatabaseManager,
  type Migrator,
} from '@nocobase/db';

/**
 * The dialects this suite can run against.
 *
 * SQLite is the default because it needs nothing installed. PostgreSQL and
 * MySQL are the ones that convert a timestamp on the way in or out, which is
 * where the defect these tests cover came from. Run them with
 * `pnpm test:integration:postgres` / `:mysql` against local test servers,
 * overriding POSTGRES_* or MYSQL_* connection settings as needed.
 *
 * CI does not run this file yet: the `db-integration` job in
 * `.github/workflows/quality.yml` runs `@nocobase/db`'s own integration suite
 * only, and its matrix includes Oracle and SQL Server, which
 * `integrationDialect()` below refuses.
 */
export type IntegrationDialect = 'sqlite' | 'postgres' | 'mysql';

/** What a connection to the same schema may differ in. */
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

const migrationsDirectory = fileURLToPath(
  new URL('../../database/migrations', import.meta.url),
);

export const CREATE_MIGRATION = '202608200001_create_workflow_collections';
export const INSTANT_MIGRATION = '202609110001_workflow_instant_columns';

/** Which database this run targets, named the way `@nocobase/db` names it. */
export function integrationDialect(): IntegrationDialect {
  const requested = (
    process.env.INTEGRATION_DB_CONNECTIONS ??
    process.env.DB_CONNECTION ??
    'sqlite'
  )
    .split(',')[0]!
    .trim()
    .toLowerCase();
  const dialect = requested === 'postgresql' ? 'postgres' : requested;
  if (dialect === 'sqlite' || dialect === 'postgres' || dialect === 'mysql')
    return dialect;
  throw new Error(
    `Workflow integration tests do not run against "${requested}".`,
  );
}

/**
 * A manager for the configured database, with isolated table prefixes and a
 * PostgreSQL schema per fixture so explicit index names cannot collide.
 */
export function createIntegrationDatabase(
  prefix: string,
  overrides: IntegrationConnectionOverrides = {},
): DatabaseManager {
  const dialect = integrationDialect();
  return createDatabaseManager({
    default: 'main',
    drivers: { sqlite, postgres, mysql },
    // Collection metadata is per-manager rather than a table in the target
    // database: the stored rows are keyed by logical name, so a shared server
    // would hand one run's metadata to the next one's differently prefixed
    // tables. This is what the `@nocobase/db` integration suite does too.
    metadataStore: metadataStoreFor(prefix),
    connections: {
      main: {
        ...connectionConfig(dialect),
        // Explicit migration index names are schema-scoped in PostgreSQL.
        ...(dialect === 'postgres' ? { schema: prefix } : {}),
        // Deliberately left at the driver default unless a test asks otherwise:
        // a connection option the engine needs in order to be correct is exactly
        // what this suite exists to show it no longer needs.
        ...(dialect === 'mysql' && overrides.mysqlTimezone
          ? { timezone: overrides.mysqlTimezone }
          : {}),
        naming: { tablePrefix: `${prefix}_` },
      },
    },
  });
}

export function createTestPrefix(): string {
  return `wf${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * One Collection metadata store per prefix, because one prefix is one schema.
 *
 * A second manager over the same tables has to read the same metadata to be
 * another connection to that database rather than a stranger introspecting it.
 * The distinction is invisible on PostgreSQL, where the physical types differ,
 * and decisive on MySQL, where `datetime` and `datetimeTz` are both
 * `DATETIME(3)`: a manager starting empty resolves these columns as the
 * zone-free type and reads the right wall clock without the `Z` that says which
 * zone it is in.
 */
const metadataStores = new Map<string, CollectionMetadataStore>();

function metadataStoreFor(prefix: string): CollectionMetadataStore {
  const existing = metadataStores.get(prefix);
  if (existing) return existing;
  const created = new InMemoryCollectionMetadataStore();
  metadataStores.set(prefix, created);
  return created;
}

/** Applies the plugin's migrations, optionally stopping at a given one. */
export async function migrate(
  database: DatabaseManager,
  prefix: string,
  upTo?: string,
): Promise<void> {
  if (integrationDialect() === 'postgres') {
    const client = await database.connection().client<Knex>();
    await client.schema.createSchemaIfNotExists(prefix);
  }
  const migrator = migratorFor(database, prefix);
  if (upTo) {
    await migrator.upTo(upTo);
    return;
  }
  await migrator.latest();
}

/**
 * Leaves the server as the test found it.
 *
 * SQLite runs in memory and forgets on its own, but PostgreSQL and MySQL are
 * shared and would otherwise collect a schema per run.
 */
export async function dropEverything(
  database: DatabaseManager,
  prefix: string,
): Promise<void> {
  const migrator = migratorFor(database, prefix);
  let rolledBack = (await migrator.rollback()).rolledBack.length;
  while (rolledBack > 0)
    rolledBack = (await migrator.rollback()).rolledBack.length;
  const client = await database.connection().client<Knex>();
  await client.schema.dropTableIfExists(`${prefix}_migrations_lock`);
  await client.schema.dropTableIfExists(`${prefix}_migrations`);
  if (integrationDialect() === 'postgres')
    await client.schema.dropSchema(prefix);
  metadataStores.delete(prefix);
}

function migratorFor(database: DatabaseManager, prefix: string): Migrator {
  return database.createMigrator({
    directory: migrationsDirectory,
    packageName: '@nocobase/app-plugin-workflow',
    tableName: `${prefix}_migrations`,
    lockTableName: `${prefix}_migrations_lock`,
  });
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

/**
 * Legacy test-server defaults; override the port and credentials through
 * POSTGRES_* or MYSQL_* variables when using local services.
 */
function connectionConfig(
  dialect: IntegrationDialect,
): SqliteConnectionConfig | PostgresConnectionConfig | MysqlConnectionConfig {
  if (dialect === 'sqlite')
    return {
      dialect: 'sqlite',
      driver: 'better-sqlite3',
      filename: process.env.SQLITE_FILENAME ?? ':memory:',
    };
  const [prefix, port] =
    dialect === 'postgres'
      ? (['POSTGRES', 15432] as const)
      : (['MYSQL', 13306] as const);
  return {
    dialect,
    host: process.env[`${prefix}_HOST`] ?? '127.0.0.1',
    port: Number(process.env[`${prefix}_PORT`] ?? port),
    username: process.env[`${prefix}_USER`] ?? 'nocobase',
    password: process.env[`${prefix}_PASSWORD`] ?? 'nocobase',
    database:
      process.env[`${prefix}_DATABASE`] ?? 'nocobase_collection_builder',
  };
}
