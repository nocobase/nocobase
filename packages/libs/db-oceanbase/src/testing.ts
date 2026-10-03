import {
  createSqlTestDatabaseProvisioner,
  type TestDatabaseEnvironment,
  type TestDatabaseProvisioner,
} from '@nocobase/db/testing';
import { oceanbase, oceanbaseDriver, type OceanbaseOptions } from './index.js';

/**
 * The server a test connects to, read from the variables the dialect's
 * integration suite also uses. The defaults are those of the OceanBase service
 * in the examples application's `docker-compose.yml`, which honours the same
 * `OCEANBASE_PORT` and `OCEANBASE_PASSWORD`; its tenant's root account may
 * create databases.
 */
export function oceanbaseTestConnection(
  env: TestDatabaseEnvironment,
): OceanbaseOptions {
  return {
    host: env.OCEANBASE_HOST ?? '127.0.0.1',
    port: Number(env.OCEANBASE_PORT ?? 2881),
    username: env.OCEANBASE_USER ?? 'root@test',
    password: env.OCEANBASE_PASSWORD ?? 'ObTest_123456',
  };
}

/** Isolates each test database in its own OceanBase database. */
export const testDatabaseProvisioner: TestDatabaseProvisioner =
  createSqlTestDatabaseProvisioner({
    dialect: 'oceanbase',
    capabilities: oceanbaseDriver.capabilities ?? {},
    admin: (env) => oceanbase(oceanbaseTestConnection(env)),
    connection: (env, name) =>
      oceanbase({ ...oceanbaseTestConnection(env), database: name }),
    statements: {
      create: 'create database ??',
      drop: 'drop database if exists ??',
      list: 'select schema_name as name from information_schema.schemata order by schema_name',
    },
  });
