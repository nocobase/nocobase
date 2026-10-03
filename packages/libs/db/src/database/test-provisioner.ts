import type { Knex } from 'knex';
import type { DatabaseCapabilities } from '../schema/adapter.js';
import { rawRows } from '../schema/inspector/shared/result.js';
import type { AnyConnectionConfig } from './config.js';
import { createDatabaseManager } from './manager.js';

/** Environment variables a provisioner reads its server address and credentials from. */
export type TestDatabaseEnvironment = Readonly<
  Record<string, string | undefined>
>;

export interface TestDatabaseProvisionOptions {
  /**
   * Identifier of the isolated database or schema to create: lower-case
   * letters, digits and underscores, short enough for every dialect.
   */
  readonly name: string;
  readonly env: TestDatabaseEnvironment;
}

export interface ProvisionedTestDatabase {
  /** Connection configuration for the isolated database, as a dialect factory returns it. */
  readonly connection: AnyConnectionConfig;
  /** Removes the isolated database or schema and releases the administrative connection. */
  drop(): Promise<void>;
}

export interface TestDatabaseListOptions {
  /** Only names starting with this prefix are returned. */
  readonly prefix: string;
  readonly env: TestDatabaseEnvironment;
}

/**
 * Creates isolated databases for tests that must not depend on one dialect.
 *
 * Each dialect package exports one from its `./testing` entry, and
 * `@nocobase/db-testing` selects it by dialect name. Everything specific to
 * the database — the server address, credentials, and the statements that
 * create and drop the isolated database — stays in the dialect package.
 */
export interface TestDatabaseProvisioner {
  readonly dialect: string;
  /**
   * The capabilities the dialect's driver declares, as on its definition.
   * Lets a test decide what to skip before any database exists.
   */
  readonly capabilities: Partial<DatabaseCapabilities>;
  provision(
    options: TestDatabaseProvisionOptions,
  ): Promise<ProvisionedTestDatabase>;
  /**
   * Isolated databases or schemas the server currently holds, so a run can
   * remove those an interrupted run left behind. Absent where nothing
   * outlives the process, as with an in-memory database.
   */
  listProvisioned?(options: TestDatabaseListOptions): Promise<string[]>;
  /** Removes one isolated database or schema named by `listProvisioned`. */
  dropProvisioned?(options: TestDatabaseProvisionOptions): Promise<void>;
}

/**
 * The statements a server dialect isolates test databases with. Every `??`
 * and `?` in them stands for the database's identifier, bound as an
 * identifier or a value respectively; a step that takes several statements
 * lists them in order.
 */
export interface SqlTestDatabaseStatements {
  readonly create: string | readonly string[];
  readonly drop: string | readonly string[];
  /**
   * Lists every database or schema on the server as rows with a `name`
   * column, spelled as the test names them: in lower case where the server
   * folds identifiers to upper case.
   */
  readonly list: string;
}

export interface SqlTestDatabaseProvisionerOptions {
  readonly dialect: string;
  readonly capabilities: Partial<DatabaseCapabilities>;
  /** The server itself, for the statements that create, list and drop isolated databases. */
  readonly admin: (env: TestDatabaseEnvironment) => AnyConnectionConfig;
  /** The isolated database named, for the tests that run on it. */
  readonly connection: (
    env: TestDatabaseEnvironment,
    name: string,
  ) => AnyConnectionConfig;
  readonly statements: SqlTestDatabaseStatements;
  /**
   * The identifier the server keeps an isolated database under, for a server
   * that folds unquoted names to upper case and whose clients log in by the
   * folded name. Defaults to the name itself.
   */
  readonly identifier?: (name: string) => string;
}

/**
 * A provisioner for a server dialect that isolates each test database with
 * one statement each to create, drop and list them, so that a dialect
 * package declares only those statements and its connection options.
 * Every statement runs on an administrative connection opened for it and
 * closed afterwards, so a test holds no connection beyond its own.
 */
export function createSqlTestDatabaseProvisioner(
  options: SqlTestDatabaseProvisionerOptions,
): TestDatabaseProvisioner {
  const { statements } = options;
  const identifier = options.identifier ?? ((name: string) => name);
  const statementsOf = (sql: string | readonly string[]): readonly string[] =>
    typeof sql === 'string' ? [sql] : sql;
  const runStatement = async (
    client: Knex,
    statement: string,
    name: string,
  ): Promise<void> => {
    const placeholders = statement.match(/\?\??/g)?.length ?? 0;
    await client.raw(
      statement,
      Array.from({ length: placeholders }, () => identifier(name)),
    );
  };
  const run = async (
    client: Knex,
    sql: string | readonly string[],
    name: string,
  ): Promise<void> => {
    for (const statement of statementsOf(sql)) {
      await runStatement(client, statement, name);
    }
  };
  const withAdmin = async <T>(
    env: TestDatabaseEnvironment,
    run: (client: Knex) => Promise<T>,
  ): Promise<T> => {
    const admin = createDatabaseManager({
      connections: { main: options.admin(env) },
    });
    try {
      return await run(await admin.connection().client<Knex>());
    } finally {
      await admin.destroy();
    }
  };
  const drop = (env: TestDatabaseEnvironment, name: string): Promise<void> =>
    withAdmin(env, (client) => run(client, statements.drop, name));
  return {
    dialect: options.dialect,
    capabilities: options.capabilities,
    provision: async ({ name, env }) => {
      await withAdmin(env, async (client) => {
        const [first, ...rest] = statementsOf(statements.create);
        // A failure of the first statement leaves nothing of this run behind — the name may even belong to
        // something that predates it — so it is not cleaned up. Once the database or user exists, a failure of a
        // later step drops it again, since the caller never receives the drop() that would.
        if (first !== undefined) await runStatement(client, first, name);
        try {
          for (const statement of rest) {
            await runStatement(client, statement, name);
          }
        } catch (error) {
          try {
            await run(client, statements.drop, name);
          } catch {
            // The create failure is what the caller needs to see; a stale sweep removes what remains.
          }
          throw error;
        }
      });
      return {
        connection: options.connection(env, name),
        drop: () => drop(env, name),
      };
    },
    listProvisioned: ({ prefix, env }) =>
      withAdmin(env, async (client) =>
        rawRows<{ name: string }>(await client.raw(statements.list))
          .map((row) => row.name)
          .filter((name) => name.startsWith(prefix)),
      ),
    dropProvisioned: ({ name, env }) => drop(env, name),
  };
}
