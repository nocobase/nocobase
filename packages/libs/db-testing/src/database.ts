import {
  createDatabaseManager,
  createMigrator,
  createSeeder,
  type AnyConnectionConfig,
  type CollectionMetadataStore,
  type DatabaseCapabilities,
  type DatabaseConnection,
  type DatabaseManager,
  type MigrationSource,
  type SeedSource,
} from '@nocobase/db';
import { hostname } from 'node:os';
import type {
  ProvisionedTestDatabase,
  TestDatabaseEnvironment,
  TestDatabaseProvisioner,
} from '@nocobase/db/testing';
import {
  loadTestDatabaseProvisioner,
  testDatabaseDialect,
} from './environment.js';

export const DEFAULT_TEST_CONNECTION: string = 'main';

export interface ProvisionTestDatabasesOptions {
  /** Where the dialect and its server are read from; defaults to `process.env`. */
  readonly env?: TestDatabaseEnvironment;
  /** One isolated database is provisioned per name; the first is the default connection. */
  readonly connections?: readonly string[];
  /** Used instead of the provisioner of the selected dialect's package. */
  readonly provisioner?: TestDatabaseProvisioner;
}

export interface OpenTestDatabaseOptions {
  /** Defaults to the store the connection keeps in its own database. */
  readonly metadataStore?: CollectionMetadataStore;
  /** Applied to the default connection after the schema is reset. */
  readonly migrations?: readonly MigrationSource[];
  /** Run on the default connection after the migrations. */
  readonly seeds?: readonly SeedSource[];
}

export interface CreateTestDatabaseOptions
  extends ProvisionTestDatabasesOptions, OpenTestDatabaseOptions {
  /**
   * Migrates and seeds once per process into a template, and gives each call a copy of it, where the dialect can copy
   * a database (`TestDatabaseProvisioner.clone`, SQLite). Elsewhere, and with a `metadataStore` of the caller's own,
   * each call migrates its own databases as without it. The template is shared by every call with the same dialect,
   * connections, migrations and seeds.
   */
  readonly template?: boolean;
}

export interface TestDatabase {
  readonly dialect: string;
  readonly database: DatabaseManager;
  /** The default connection. */
  readonly connection: DatabaseConnection;
  readonly capabilities: DatabaseCapabilities;
  /** Applies every pending migration from `sources`. */
  migrate(
    sources: readonly MigrationSource[],
    connection?: string,
  ): Promise<void>;
  /** Runs every seed from `sources` that has not run yet. */
  seed(sources: readonly SeedSource[], connection?: string): Promise<void>;
  /** Drops everything every connection manages, leaving empty databases. */
  reset(): Promise<void>;
  /** Closes the connections, and drops the databases when this object provisioned them. */
  destroy(): Promise<void>;
}

/**
 * Isolated databases on the selected dialect, created once and opened as
 * often as needed. A test runner provisions once per worker and opens a
 * fresh Database Manager for every test.
 */
export interface ProvisionedTestDatabases {
  readonly dialect: string;
  readonly connections: readonly string[];
  /** Connection configuration for one isolated database, for callers that build their own manager. */
  connectionConfig(name?: string): AnyConnectionConfig;
  /** Opens a Database Manager on empty databases: the schema is reset before anything else runs. */
  open(options?: OpenTestDatabaseOptions): Promise<TestDatabase>;
  drop(): Promise<void>;
}

let provisionCount = 0;

export async function provisionTestDatabases(
  options: ProvisionTestDatabasesOptions = {},
): Promise<ProvisionedTestDatabases> {
  const env = options.env ?? process.env;
  const dialect = options.provisioner?.dialect ?? testDatabaseDialect(env);
  const names = options.connections ?? [DEFAULT_TEST_CONNECTION];
  assertConnectionNames(names);
  const provisioner =
    options.provisioner ?? (await loadTestDatabaseProvisioner(dialect));
  await removeStaleDatabases(provisioner, env);
  const provisioned = await provisionEach(names, env, (name) =>
    provisioner.provision({ name, env }),
  );
  return provisionedDatabases(dialect, names, provisioned);
}

function assertConnectionNames(names: readonly string[]): void {
  if (names.length === 0 || new Set(names).size !== names.length) {
    throw new Error(
      'Test database connections must be a non-empty list of distinct names.',
    );
  }
}

/** One isolated database per connection name, each from `create` under a fresh name; all dropped if one fails. */
async function provisionEach(
  names: readonly string[],
  env: TestDatabaseEnvironment,
  create: (name: string, index: number) => Promise<ProvisionedTestDatabase>,
): Promise<Array<[string, ProvisionedTestDatabase, string]>> {
  const prefix = isolatedDatabasePrefix(env);
  const provisioned: Array<[string, ProvisionedTestDatabase, string]> = [];
  try {
    for (const [index, name] of names.entries()) {
      const isolated = `${prefix}_${index}`;
      provisioned.push([name, await create(isolated, index), isolated]);
    }
  } catch (error) {
    await dropAll(provisioned.map(([, database]) => database));
    throw error;
  }
  return provisioned;
}

function provisionedDatabases(
  dialect: string,
  names: readonly string[],
  provisioned: ReadonlyArray<[string, ProvisionedTestDatabase, string]>,
): ProvisionedTestDatabases {
  const configs = new Map(
    provisioned.map(([name, database]) => [name, database.connection]),
  );
  const connectionConfig = (
    name: string = names[0] ?? DEFAULT_TEST_CONNECTION,
  ): AnyConnectionConfig => {
    const config = configs.get(name);
    if (!config) {
      throw new Error(`Test database connection "${name}" is not provisioned.`);
    }
    return config;
  };
  return {
    dialect,
    connections: names,
    connectionConfig,
    open: (openOptions = {}) =>
      openTestDatabase(dialect, names, connectionConfig, openOptions),
    drop: () => dropAll(provisioned.map(([, database]) => database)),
  };
}

/** Provisions isolated databases and opens them in one step; `destroy()` drops them again. */
export async function createTestDatabase(
  options: CreateTestDatabaseOptions = {},
): Promise<TestDatabase> {
  const provisioned =
    (options.template && !options.metadataStore
      ? await cloneTemplate(options)
      : undefined) ?? (await provisionTestDatabases(options));
  let database: TestDatabase;
  try {
    database = await provisioned.open(options);
  } catch (error) {
    await provisioned.drop();
    throw error;
  }
  return {
    ...database,
    destroy: async () => {
      try {
        await database.destroy();
      } finally {
        await provisioned.drop();
      }
    },
  };
}

/** The isolated names of each template's databases, by provisioner and by what was applied to them. */
const templates = new WeakMap<
  TestDatabaseProvisioner,
  Map<string, Promise<readonly string[]>>
>();

/**
 * Copies of a template migrated and seeded once, opened without resetting them: what `open` would otherwise apply is
 * already there. Undefined when the dialect cannot copy a database.
 */
async function cloneTemplate(
  options: CreateTestDatabaseOptions,
): Promise<ProvisionedTestDatabases | undefined> {
  const env = options.env ?? process.env;
  const dialect = options.provisioner?.dialect ?? testDatabaseDialect(env);
  const provisioner =
    options.provisioner ?? (await loadTestDatabaseProvisioner(dialect));
  const clone = provisioner.clone?.bind(provisioner);
  if (!clone) return undefined;
  const names = options.connections ?? [DEFAULT_TEST_CONNECTION];
  assertConnectionNames(names);
  const key = JSON.stringify([
    dialect,
    names,
    options.migrations ?? [],
    options.seeds ?? [],
  ]);
  let byKey = templates.get(provisioner);
  if (!byKey)
    templates.set(
      provisioner,
      (byKey = new Map<string, Promise<readonly string[]>>()),
    );
  let template = byKey.get(key);
  if (!template) {
    template = (async () => {
      await removeStaleDatabases(provisioner, env);
      const created = await provisionEach(names, env, (name) =>
        provisioner.provision({ name, env }),
      );
      const provisioned = provisionedDatabases(dialect, names, created);
      const database = await provisioned.open(options).catch(async (error) => {
        await provisioned.drop();
        throw error;
      });
      // Closed, so that every copy is complete. A run's templates live as long as its process; the next run drops
      // them with the other databases dead processes left behind.
      await database.destroy();
      return created.map(([, , isolated]) => isolated);
    })();
    byKey.set(key, template);
    template.catch(() => byKey.delete(key));
  }
  const sources = await template;
  const copies = await provisionEach(names, env, (name, index) =>
    clone({ source: sources[index] ?? '', name, env }),
  );
  const copied = provisionedDatabases(dialect, names, copies);
  return {
    ...copied,
    open: (openOptions = {}) =>
      openTestDatabase(
        dialect,
        names,
        (name) => copied.connectionConfig(name),
        {
          ...(openOptions.metadataStore
            ? { metadataStore: openOptions.metadataStore }
            : {}),
          prepared: true,
        },
      ),
  };
}

async function openTestDatabase(
  dialect: string,
  names: readonly string[],
  connectionConfig: (name?: string) => AnyConnectionConfig,
  options: OpenTestDatabaseOptions & {
    /** The databases are a template's copies: already reset, migrated and seeded. */
    readonly prepared?: boolean;
  },
): Promise<TestDatabase> {
  const defaultName = names[0] ?? DEFAULT_TEST_CONNECTION;
  const database = createDatabaseManager({
    default: defaultName,
    connections: Object.fromEntries(
      names.map((name) => [name, connectionConfig(name)]),
    ),
    ...(options.metadataStore ? { metadataStore: options.metadataStore } : {}),
  });
  const reset = async (): Promise<void> => {
    for (const name of names) {
      await database.connection(name).resetManagedSchema();
    }
    // Resetting the schema empties the metadata store a connection keeps in its own database, but not one the
    // caller supplied; its Collection documents would outlive their tables, so it is emptied here.
    if (options.metadataStore) {
      await clearMetadataStore(options.metadataStore);
      for (const name of names) {
        database.connection(name).collections.invalidate();
      }
    }
  };
  const migrate = async (
    sources: readonly MigrationSource[],
    connection: string = defaultName,
  ): Promise<void> => {
    if (sources.length === 0) return;
    await createMigrator({ database, connection, sources }).latest();
  };
  const seed = async (
    sources: readonly SeedSource[],
    connection: string = defaultName,
  ): Promise<void> => {
    if (sources.length === 0) return;
    await createSeeder({ database, connection, sources }).run();
  };
  try {
    if (!options.prepared) {
      await reset();
      await migrate(options.migrations ?? []);
      await seed(options.seeds ?? []);
    }
  } catch (error) {
    await database.destroy();
    throw error;
  }
  const connection = database.connection(defaultName);
  return {
    dialect,
    database,
    connection,
    capabilities: connection.capabilities,
    migrate,
    seed,
    reset,
    destroy: () => database.destroy(),
  };
}

async function clearMetadataStore(
  store: CollectionMetadataStore,
): Promise<void> {
  if (!store.capabilities.writable) {
    throw new Error(
      'A test database cannot be reset with a read-only metadata store: its Collection documents would outlive their tables.',
    );
  }
  // Deleting shifts the pages, so each round reads the first page again until nothing is left.
  let page = await store.list();
  while (page.items.length > 0) {
    for (const item of page.items) {
      await store.delete(item.name, { expectedRevision: item.revision });
    }
    page = await store.list();
  }
}

async function dropAll(
  databases: readonly ProvisionedTestDatabase[],
): Promise<void> {
  const failures: unknown[] = [];
  for (const database of [...databases].reverse()) {
    try {
      await database.drop();
    } catch (error) {
      failures.push(error);
    }
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) {
    throw new AggregateError(
      failures,
      'Failed to drop several test databases.',
    );
  }
}

/**
 * Every name starts with `nbt_<host>_<pid>_`: the host tag keeps one machine
 * from judging another machine's processes when several share a server, and
 * the process id tells whether the run that created it is still alive.
 */
function isolatedDatabasePrefix(env: TestDatabaseEnvironment): string {
  provisionCount += 1;
  const worker = sanitize(env.VITEST_POOL_ID ?? env.VITEST_WORKER_ID ?? '0');
  const random = Math.random().toString(36).slice(2, 8);
  return `${hostPrefix()}${process.pid}_${worker}_${provisionCount}_${random}`;
}

function hostPrefix(): string {
  let hash = 0x811c9dc5;
  for (const character of hostname()) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return `nbt_${(hash >>> 0).toString(36).padStart(7, '0')}_`;
}

function sanitize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

const staleRemovals = new WeakMap<TestDatabaseProvisioner, Promise<void>>();

/**
 * Drops the isolated databases an interrupted run on this machine left
 * behind: those whose creating process no longer exists. Runs once per
 * process and provisioner, and only warns when it cannot finish, because a
 * leftover database never makes a test wrong.
 */
function removeStaleDatabases(
  provisioner: TestDatabaseProvisioner,
  env: TestDatabaseEnvironment,
): Promise<void> {
  if (!provisioner.listProvisioned || !provisioner.dropProvisioned) {
    return Promise.resolve();
  }
  const listProvisioned = provisioner.listProvisioned.bind(provisioner);
  const dropProvisioned = provisioner.dropProvisioned.bind(provisioner);
  let pending = staleRemovals.get(provisioner);
  if (!pending) {
    pending = (async () => {
      const prefix = hostPrefix();
      try {
        const names = await listProvisioned({ prefix, env });
        for (const name of names) {
          const pid = Number(name.slice(prefix.length).split('_')[0]);
          if (!Number.isInteger(pid) || isRunning(pid)) continue;
          await dropProvisioned({ name, env });
        }
      } catch (error) {
        console.warn(
          `[db-testing] Could not remove stale ${provisioner.dialect} test databases:`,
          error instanceof Error ? error.message : error,
        );
      }
    })();
    staleRemovals.set(provisioner, pending);
  }
  return pending;
}

function isRunning(pid: number): boolean {
  if (pid === process.pid) return true;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM: the process exists but belongs to someone else.
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}
