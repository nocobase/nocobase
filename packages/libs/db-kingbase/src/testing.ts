import {
  createSqlTestDatabaseProvisioner,
  type TestDatabaseEnvironment,
  type TestDatabaseProvisioner,
} from '@nocobase/db/testing';
import { kingbase, kingbaseDriver, type KingbaseOptions } from './index.js';

/**
 * The server a test connects to, read from the variables the dialect's
 * integration suite also uses. The defaults are those of the Kingbase service
 * in the examples application's `docker-compose.yml`, which honours the same
 * `KINGBASE_PORT`.
 */
export function kingbaseTestConnection(
  env: TestDatabaseEnvironment,
): KingbaseOptions {
  return {
    host: env.KINGBASE_HOST ?? env.PGHOST ?? '127.0.0.1',
    port: Number(env.KINGBASE_PORT ?? env.PGPORT ?? 54321),
    username: env.KINGBASE_USER ?? env.PGUSER ?? 'nocobase',
    password: env.KINGBASE_PASSWORD ?? env.PGPASSWORD ?? 'nocobase',
    database: env.KINGBASE_DATABASE ?? env.PGDATABASE ?? 'test',
  };
}

/** Isolates each test database in its own schema of one server database. */
export const testDatabaseProvisioner: TestDatabaseProvisioner =
  createSqlTestDatabaseProvisioner({
    dialect: 'kingbase',
    capabilities: kingbaseDriver.capabilities ?? {},
    admin: (env) => kingbase(kingbaseTestConnection(env)),
    connection: (env, name) =>
      kingbase({ ...kingbaseTestConnection(env), schema: name }),
    statements: {
      create: 'create schema ??',
      drop: 'drop schema if exists ?? cascade',
      list: 'select schema_name as name from information_schema.schemata order by schema_name',
    },
  });
