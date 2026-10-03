import {
  createSqlTestDatabaseProvisioner,
  type TestDatabaseEnvironment,
  type TestDatabaseProvisioner,
} from '@nocobase/db/testing';
import { dameng, damengDriver, type DamengOptions } from './index.js';

/** The password of every user a test database is isolated in; they exist only on a test server. */
const TEST_USER_PASSWORD = 'NocoBase_Test_2026';

/**
 * The server a test connects to, read from the variables the dialect's
 * integration suite also uses. The defaults are those of the Dameng service in
 * the examples application's `docker-compose.yml`, which honours the same
 * `DAMENG_PORT`; creating a user needs `SYSDBA`, which that suite connects as.
 */
export function damengTestConnection(
  env: TestDatabaseEnvironment,
): DamengOptions {
  return {
    connectString: `${env.DAMENG_HOST ?? '127.0.0.1'}:${Number(env.DAMENG_PORT ?? 5236)}`,
    username: env.DAMENG_USER ?? 'SYSDBA',
    password: env.DAMENG_PASSWORD ?? 'SYSDBA001',
  };
}

/**
 * Isolates each test database in a user of its own, since Dameng keeps a
 * schema per user and the inspector reads the connected user's objects. The
 * user is created under its upper-case name so that a client logs in by it
 * without quoting.
 */
export const testDatabaseProvisioner: TestDatabaseProvisioner =
  createSqlTestDatabaseProvisioner({
    dialect: 'dameng',
    capabilities: damengDriver.capabilities ?? {},
    admin: (env) => dameng(damengTestConnection(env)),
    connection: (env, name) =>
      dameng({
        ...damengTestConnection(env),
        username: name.toUpperCase(),
        password: TEST_USER_PASSWORD,
        schema: name.toUpperCase(),
      }),
    identifier: (name) => name.toUpperCase(),
    statements: {
      create: [
        `create user ?? identified by "${TEST_USER_PASSWORD}"`,
        'grant resource to ??',
      ],
      drop: 'drop user if exists ?? cascade',
      list: 'select lower(username) as "name" from dba_users order by username',
    },
  });
