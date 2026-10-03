import {
  createSqlTestDatabaseProvisioner,
  type TestDatabaseEnvironment,
  type TestDatabaseProvisioner,
} from '@nocobase/db/testing';
import { oracle, oracleDriver, type OracleOptions } from './index.js';

/** The password of every user a test database is isolated in; they exist only on a test server. */
const TEST_USER_PASSWORD = 'NocoBase_Test_2026';

/**
 * The server a test connects to. The defaults are those of the Oracle service
 * in the examples application's `docker-compose.yml`, which honours the same
 * `ORACLE_PORT`. Creating a user needs the administrative account, so this
 * reads `ORACLE_ADMIN_USER` rather than the application user the integration
 * suite connects as.
 */
export function oracleTestConnection(
  env: TestDatabaseEnvironment,
): OracleOptions {
  return {
    host: env.ORACLE_HOST ?? '127.0.0.1',
    port: Number(env.ORACLE_PORT ?? 1521),
    username: env.ORACLE_ADMIN_USER ?? 'system',
    password: env.ORACLE_ADMIN_PASSWORD ?? 'nocobase',
    serviceName: env.ORACLE_SERVICE_NAME ?? 'FREEPDB1',
  };
}

/**
 * Isolates each test database in a user of its own, since Oracle keeps a
 * schema per user and the inspector reads the connected user's objects. The
 * user is created under its upper-case name so that a client logs in by it
 * without quoting.
 */
export const testDatabaseProvisioner: TestDatabaseProvisioner =
  createSqlTestDatabaseProvisioner({
    dialect: 'oracle',
    capabilities: oracleDriver.capabilities ?? {},
    admin: (env) => oracle(oracleTestConnection(env)),
    connection: (env, name) =>
      oracle({
        ...oracleTestConnection(env),
        username: name.toUpperCase(),
        password: TEST_USER_PASSWORD,
      }),
    identifier: (name) => name.toUpperCase(),
    statements: {
      create: [
        `create user ?? identified by "${TEST_USER_PASSWORD}" quota unlimited on users`,
        'grant create session, create table, create view, create materialized view, create sequence, create synonym, create procedure, create trigger, create type to ??',
      ],
      // `drop user if exists` is Oracle 23ai syntax; this block drops the user on every supported version and
      // ignores only ORA-01918, "user does not exist".
      drop: `begin execute immediate 'drop user "' || ? || '" cascade'; exception when others then if sqlcode != -1918 then raise; end if; end;`,
      list: 'select lower(username) as "name" from all_users order by username',
    },
  });
