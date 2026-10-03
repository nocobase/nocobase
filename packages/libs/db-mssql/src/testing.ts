import {
  createSqlTestDatabaseProvisioner,
  type TestDatabaseEnvironment,
  type TestDatabaseProvisioner,
} from '@nocobase/db/testing';
import { mssql, mssqlDriver, type MssqlOptions } from './index.js';

/**
 * The server a test connects to, read from the variables the dialect's
 * integration suite also uses. The defaults are those of the SQL Server
 * service in the examples application's `docker-compose.yml`, which honours
 * the same `MSSQL_PORT`. Creating a database needs the administrative
 * account, which the integration suite also connects as.
 */
export function mssqlTestConnection(
  env: TestDatabaseEnvironment,
): MssqlOptions {
  return {
    host: env.MSSQL_HOST ?? '127.0.0.1',
    port: Number(env.MSSQL_PORT ?? 1433),
    username: env.MSSQL_USER ?? 'sa',
    password: env.MSSQL_PASSWORD ?? 'NocoBase_Mssql_2026',
    database: 'master',
    encrypt: false,
    trustServerCertificate: true,
  };
}

/** Isolates each test database in its own SQL Server database. */
export const testDatabaseProvisioner: TestDatabaseProvisioner =
  createSqlTestDatabaseProvisioner({
    dialect: 'mssql',
    capabilities: mssqlDriver.capabilities ?? {},
    admin: (env) => mssql(mssqlTestConnection(env)),
    connection: (env, name) =>
      mssql({ ...mssqlTestConnection(env), database: name }),
    statements: {
      create: 'create database ??',
      // A database with open sessions cannot be dropped; a test that leaked a connection must not keep it alive.
      drop: [
        'if db_id(?) is not null alter database ?? set single_user with rollback immediate',
        'drop database if exists ??',
      ],
      list: 'select name from sys.databases order by name',
    },
  });
