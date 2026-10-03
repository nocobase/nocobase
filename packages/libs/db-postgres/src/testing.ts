import {
  createSqlTestDatabaseProvisioner,
  type TestDatabaseEnvironment,
  type TestDatabaseProvisioner,
} from '@nocobase/db/testing';
import { postgres, postgresDriver, type PostgresOptions } from './index.js';

/**
 * The server a test connects to, read from the variables the dialect's
 * integration suite also uses. The defaults are those of the PostgreSQL
 * service in the examples application's `docker-compose.yml`, which honours
 * the same `POSTGRES_PORT`.
 */
export function postgresTestConnection(
  env: TestDatabaseEnvironment,
): PostgresOptions {
  return {
    host: env.POSTGRES_HOST ?? env.PGHOST ?? '127.0.0.1',
    port: Number(env.POSTGRES_PORT ?? env.PGPORT ?? 15432),
    username: env.POSTGRES_USER ?? env.PGUSER ?? 'nocobase',
    password: env.POSTGRES_PASSWORD ?? env.PGPASSWORD ?? 'nocobase',
    database:
      env.POSTGRES_DATABASE ?? env.PGDATABASE ?? 'nocobase_collection_builder',
  };
}

/** Isolates each test database in its own schema of one server database. */
export const testDatabaseProvisioner: TestDatabaseProvisioner =
  createSqlTestDatabaseProvisioner({
    dialect: 'postgres',
    capabilities: postgresDriver.capabilities ?? {},
    admin: (env) => postgres(postgresTestConnection(env)),
    connection: (env, name) =>
      postgres({ ...postgresTestConnection(env), schema: name }),
    statements: {
      create: 'create schema ??',
      drop: 'drop schema if exists ?? cascade',
      list: 'select nspname as name from pg_catalog.pg_namespace order by nspname',
    },
  });
