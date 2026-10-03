import {
  createSqlTestDatabaseProvisioner,
  type TestDatabaseEnvironment,
  type TestDatabaseProvisioner,
} from '@nocobase/db/testing';
import { mysql, mysqlDriver, type MysqlOptions } from './index.js';

/**
 * The server a test connects to. The defaults are those of the MySQL service
 * in the examples application's `docker-compose.yml`, which honours the same
 * `MYSQL_PORT`. Creating a database needs an account with that privilege, so
 * this reads the administrative account rather than the application user the
 * integration suite connects as.
 */
export function mysqlTestConnection(
  env: TestDatabaseEnvironment,
): MysqlOptions {
  return {
    host: env.MYSQL_HOST ?? '127.0.0.1',
    port: Number(env.MYSQL_PORT ?? 3306),
    username: env.MYSQL_ADMIN_USER ?? 'root',
    password: env.MYSQL_ADMIN_PASSWORD ?? env.MYSQL_ROOT_PASSWORD ?? 'root',
  };
}

/** Isolates each test database in its own MySQL database. */
export const testDatabaseProvisioner: TestDatabaseProvisioner =
  createSqlTestDatabaseProvisioner({
    dialect: 'mysql',
    capabilities: mysqlDriver.capabilities ?? {},
    admin: (env) => mysql(mysqlTestConnection(env)),
    connection: (env, name) =>
      mysql({ ...mysqlTestConnection(env), database: name }),
    statements: {
      create: 'create database ??',
      drop: 'drop database if exists ??',
      list: 'select schema_name as name from information_schema.schemata order by schema_name',
    },
  });
