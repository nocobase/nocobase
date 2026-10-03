import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  provisionTestDatabases,
  type ProvisionTestDatabasesOptions,
  type ProvisionedTestDatabases,
} from '@nocobase/db-testing';

/** Configuration values as an application configuration file holds them, section by section. */
export type TestAppConfigValues = Readonly<Record<string, unknown>>;

export interface CreateTestAppConfigOptions {
  /**
   * The application's connections to give a test database of its own, by name; `['main']` by default. A connection
   * left out keeps what the application configures for it, which is how an `external` connection keeps the database
   * the application reads but does not own.
   */
  readonly connections?: readonly string[];
  /**
   * Further configuration, section by section, written beneath the test databases into the same file, such as
   * `{ users: { initialAdmin: … } }`. Its `database.connections` entries are merged into the provisioned ones.
   */
  readonly config?: TestAppConfigValues;
  /**
   * Whether the application installs itself when it starts: runs its own and its plugins' migrations and seeds on
   * each provisioned connection. `true` by default, which is the application a user has after `db apply`; `false`
   * leaves the databases empty for a test that applies them itself.
   */
  readonly install?: boolean;
  /** Where the dialect and its server are read from; defaults to `process.env`. */
  readonly env?: ProvisionTestDatabasesOptions['env'];
}

/** A configuration file that points an application at test databases of its own. */
export interface TestAppConfig {
  /** The file, to hand to the application as `configPath` or `APP_CONFIG_FILE`. */
  readonly path: string;
  /** A temporary directory holding the file, and the place for anything else the test application writes. */
  readonly directory: string;
  /** The provisioned databases, one per connection named. */
  readonly testDatabases: ProvisionedTestDatabases;
  /** Drops the databases and removes the directory. */
  dispose(): Promise<void>;
}

/**
 * Provisions an isolated database on the dialect `NOCOBASE_TEST_DB_DIALECT` selects — SQLite when it is unset — for
 * each connection named, and writes the application configuration that points at them. The file goes through the
 * channel a deployment's own configuration does, so the application under test resolves it exactly as it resolves
 * `config.yml`.
 */
export async function createTestAppConfig(
  options: CreateTestAppConfigOptions = {},
): Promise<TestAppConfig> {
  const testDatabases = await provisionTestDatabases({
    ...(options.connections ? { connections: options.connections } : {}),
    ...(options.env ? { env: options.env } : {}),
  });
  let directory: string | undefined;
  try {
    directory = await mkdtemp(path.join(tmpdir(), 'nocobase-test-app-'));
    const file = path.join(directory, 'config.json');
    await writeFile(
      file,
      `${JSON.stringify(testAppConfigValues(testDatabases, options), null, 2)}\n`,
    );
    const owned = directory;
    return {
      path: file,
      directory: owned,
      testDatabases,
      dispose: async () => {
        try {
          await testDatabases.drop();
        } finally {
          await rm(owned, { recursive: true, force: true });
        }
      },
    };
  } catch (error) {
    try {
      await testDatabases.drop();
    } finally {
      if (directory) await rm(directory, { recursive: true, force: true });
    }
    throw error;
  }
}

function testAppConfigValues(
  databases: ProvisionedTestDatabases,
  options: CreateTestAppConfigOptions,
): Record<string, unknown> {
  const extra = options.config ?? {};
  const extraDatabase = recordOf(extra.database);
  const extraConnections = recordOf(extraDatabase.connections);
  const install = options.install !== false;
  const connections = Object.fromEntries(
    databases.connections.map((name) => [
      name,
      {
        ...serializableConnection(databases.connectionConfig(name)),
        // Spelled out both ways: an application runs its migrations at startup unless told otherwise.
        migrations: { autoRun: install },
        seeds: { autoRun: install },
        ...recordOf(extraConnections[name]),
      },
    ]),
  );
  return {
    ...extra,
    database: {
      ...extraDatabase,
      connections: { ...extraConnections, ...connections },
    },
  };
}

/**
 * A provisioned connection as a configuration file spells it. The driver object a provisioner attaches cannot be
 * written to a file and is not needed there: the application loads the official driver of the connection's dialect
 * itself, as it does for `config.yml`.
 */
function serializableConnection(config: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(config).filter(
      ([key, value]) => key !== 'databaseDriver' && typeof value !== 'function',
    ),
  );
}

function recordOf(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
