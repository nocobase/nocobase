import {
  createMigrator,
  loadMigrations,
  type CollectionMetadataStore,
  type DatabaseCapabilities,
  type DatabaseConnection,
  type DatabaseManager,
  type MigrationSource,
  type SeedSource,
} from '@nocobase/db';
import { describe, expect, test, type TestAPI } from 'vitest';
import {
  inspectCollection,
  type CollectionFieldSnapshot,
  type CollectionReferentialAction,
  type CollectionSchemaSnapshot,
} from './collection-schema.js';
import {
  createTestDatabase,
  provisionTestDatabases,
  type ProvisionedTestDatabases,
  type TestDatabase,
} from './database.js';

export * from './index.js';

/**
 * How tests in one file are kept apart.
 *
 * - `schema` (the default): every test opens a fresh Database Manager on
 *   emptied databases and runs the migrations and seeds again, the way a new
 *   SQLite database in each `beforeEach` behaves. A test that runs
 *   concurrently with its siblings (`test.concurrent`, `describe.concurrent`)
 *   cannot share the file's databases with them and gets databases of its own.
 * - `none`: one Database Manager for the whole file; tests share its state.
 */
export type DatabaseTestIsolation = 'schema' | 'none';

export interface DatabaseTestOptions {
  readonly migrations?: readonly MigrationSource[];
  readonly seeds?: readonly SeedSource[];
  readonly isolation?: DatabaseTestIsolation;
  /** One isolated database per name; the first is the default connection. */
  readonly connections?: readonly string[];
  /** Called for every Database Manager opened; defaults to the store the connection keeps in its own database. */
  readonly metadataStore?: () => CollectionMetadataStore;
}

export interface DatabaseTestContext {
  /** The isolated databases this file runs on, provisioned once per file. */
  readonly testDatabases: ProvisionedTestDatabases;
  readonly testDatabase: TestDatabase;
  readonly database: DatabaseManager;
  readonly connection: DatabaseConnection;
  readonly dialect: string;
  readonly capabilities: DatabaseCapabilities;
  readonly expectCollection: (name: string) => CollectionExpectation;
}

export type DatabaseTestAPI = TestAPI<DatabaseTestContext>;

/**
 * A Vitest `test` whose context carries a database on the dialect the
 * environment selects: SQLite unless `NOCOBASE_TEST_DB_DIALECT` names another.
 */
export function createDatabaseTest(
  options: DatabaseTestOptions = {},
): DatabaseTestAPI {
  const isolation = options.isolation ?? 'schema';
  const provision = (): Promise<ProvisionedTestDatabases> =>
    provisionTestDatabases({
      ...(options.connections ? { connections: options.connections } : {}),
    });
  return test.extend<DatabaseTestContext>({
    testDatabases: [
      // Vitest reads a fixture's dependencies from this destructuring pattern; this one has none.
      // eslint-disable-next-line no-empty-pattern
      async ({}, use) => {
        const databases = await provision();
        try {
          await use(databases);
        } finally {
          await databases.drop();
        }
      },
      { scope: 'file' },
    ],
    testDatabase: [
      async ({ testDatabases, task }, use) => {
        // A concurrent test cannot share the file's databases: the tests running beside it would reset and
        // migrate the same database under it. It gets databases of its own for as long as it runs.
        const own =
          isolation === 'schema' && task.concurrent === true
            ? await provision()
            : undefined;
        try {
          const database = await (own ?? testDatabases).open({
            migrations: options.migrations ?? [],
            seeds: options.seeds ?? [],
            ...(options.metadataStore
              ? { metadataStore: options.metadataStore() }
              : {}),
          });
          try {
            await use(database);
          } finally {
            await database.destroy();
          }
        } finally {
          await own?.drop();
        }
      },
      { scope: isolation === 'none' ? 'file' : 'test' },
    ],
    database: async ({ testDatabase }, use) => use(testDatabase.database),
    connection: async ({ testDatabase }, use) => use(testDatabase.connection),
    dialect: async ({ testDatabase }, use) => use(testDatabase.dialect),
    capabilities: async ({ testDatabase }, use) =>
      use(testDatabase.capabilities),
    expectCollection: async ({ testDatabase }, use) =>
      use((name: string) => expectCollection(testDatabase.connection, name)),
  });
}

export interface CollectionIndexExpectation {
  readonly unique?: boolean;
}

export interface CollectionForeignKeyExpectation {
  readonly referencedFields?: readonly string[];
  readonly onDelete?: CollectionReferentialAction;
  readonly onUpdate?: CollectionReferentialAction;
}

export interface NegatedCollectionExpectation {
  toExist(): Promise<void>;
  toHaveField(name: string): Promise<void>;
  toHaveIndex(fields: readonly string[]): Promise<void>;
  toHaveForeignKey(
    fields: readonly string[],
    collection: string,
  ): Promise<void>;
}

/**
 * Assertions on a Collection's physical schema in logical terms, so the same
 * expectation holds on every dialect. Field and Collection names are
 * compared; index and constraint names, native types and table names are not.
 */
export interface CollectionExpectation {
  /** Resolves with the snapshot so a test can make further assertions of its own. */
  toExist(): Promise<CollectionSchemaSnapshot>;
  toHaveField(
    name: string,
    expected?: Partial<CollectionFieldSnapshot>,
  ): Promise<void>;
  toHaveIndex(
    fields: readonly string[],
    expected?: CollectionIndexExpectation,
  ): Promise<void>;
  toHaveForeignKey(
    fields: readonly string[],
    collection: string,
    expected?: CollectionForeignKeyExpectation,
  ): Promise<void>;
  readonly not: NegatedCollectionExpectation;
}

export function expectCollection(
  connection: DatabaseConnection,
  name: string,
): CollectionExpectation {
  const snapshot = async (): Promise<CollectionSchemaSnapshot> => {
    const inspected = await inspectCollection(connection, name);
    expect(
      inspected,
      `Collection "${name}" has no table on this connection`,
    ).toBeDefined();
    return inspected as CollectionSchemaSnapshot;
  };
  return {
    toExist: snapshot,
    toHaveField: async (field, expected = {}) => {
      const { fields } = await snapshot();
      expect(
        Object.keys(fields),
        `Collection "${name}" has no Field "${field}"`,
      ).toContain(field);
      expect(fields[field], `Field "${name}.${field}"`).toMatchObject(expected);
    },
    toHaveIndex: async (fields, expected = {}) => {
      const { indexes } = await snapshot();
      expect(
        indexes,
        `Collection "${name}" has no ${describeIndex(fields, expected.unique)}`,
      ).toContainEqual(
        expected.unique === undefined
          ? expect.objectContaining({ fields })
          : { fields, unique: expected.unique },
      );
    },
    toHaveForeignKey: async (fields, collection, expected = {}) => {
      const { foreignKeys } = await snapshot();
      expect(
        foreignKeys,
        `Collection "${name}" has no foreign key (${fields.join(', ')}) to "${collection}"`,
      ).toContainEqual(
        expect.objectContaining({ fields, collection, ...expected }),
      );
    },
    not: {
      toExist: async () => {
        expect(
          await inspectCollection(connection, name),
          `Collection "${name}" still has a table on this connection`,
        ).toBeUndefined();
      },
      toHaveField: async (field) => {
        const { fields } = await snapshot();
        expect(
          Object.keys(fields),
          `Collection "${name}" still has Field "${field}"`,
        ).not.toContain(field);
      },
      toHaveIndex: async (fields) => {
        const { indexes } = await snapshot();
        expect(
          indexes,
          `Collection "${name}" still has an index on (${fields.join(', ')})`,
        ).not.toContainEqual(expect.objectContaining({ fields }));
      },
      toHaveForeignKey: async (fields, collection) => {
        const { foreignKeys } = await snapshot();
        expect(
          foreignKeys,
          `Collection "${name}" still has a foreign key (${fields.join(', ')}) to "${collection}"`,
        ).not.toContainEqual(expect.objectContaining({ fields, collection }));
      },
    },
  };
}

export interface MigrationTestContext {
  readonly database: DatabaseManager;
  readonly connection: DatabaseConnection;
  readonly dialect: string;
  readonly capabilities: DatabaseCapabilities;
  readonly expectCollection: (name: string) => CollectionExpectation;
}

export interface DescribeMigrationOptions {
  /**
   * Every source the migration is loaded from, its own package's included.
   * Migrations named before it, from any source, run first, as they would in
   * an application.
   */
  readonly sources: readonly MigrationSource[];
  /**
   * Runs once the migrations before this one are applied and before this one
   * is: the place to write the rows a data migration has to carry forward.
   */
  readonly before?: (context: MigrationTestContext) => Promise<void> | void;
  /** Assertions on the schema the migration leaves; run after `up` and again after it is reapplied. */
  readonly up?: (context: MigrationTestContext) => Promise<void> | void;
  /** Assertions after the migration is rolled back. */
  readonly down?: (context: MigrationTestContext) => Promise<void> | void;
  /** `false` for a migration that has no `down`; it is then only applied. */
  readonly reversible?: boolean;
  readonly metadataStore?: () => CollectionMetadataStore;
}

/**
 * The test every migration needs, on the selected dialect: apply it after
 * the migrations before it, check the schema, roll it back, check that every
 * table is exactly what it was before it ran — its Fields, indexes and
 * foreign keys, not only its name — and apply it again. Each step also
 * checks that Collection metadata and physical tables agree.
 */
export function describeMigration(
  name: string,
  options: DescribeMigrationOptions,
): void {
  describe(name, () => {
    test(
      options.reversible === false
        ? 'applies after the migrations before it'
        : 'applies, rolls back to the previous schema, and applies again',
      () => verifyMigration(name, options),
    );
  });
}

/** What `describeMigration` runs, for a test that needs to call it itself. */
export async function verifyMigration(
  name: string,
  options: DescribeMigrationOptions,
): Promise<void> {
  const migrations = await loadMigrations({ sources: options.sources });
  const position = migrations.findIndex((migration) => migration.name === name);
  if (position < 0) {
    throw new Error(
      `Migration "${name}" is not in the given sources: ${migrations.map((migration) => migration.name).join(', ') || 'none'}.`,
    );
  }
  const previous = migrations[position - 1]?.name;
  const testDatabase = await createTestDatabase(
    options.metadataStore ? { metadataStore: options.metadataStore() } : {},
  );
  try {
    const { database, connection } = testDatabase;
    const context: MigrationTestContext = {
      database,
      connection,
      dialect: testDatabase.dialect,
      capabilities: testDatabase.capabilities,
      expectCollection: (collection) =>
        expectCollection(connection, collection),
    };
    const migrator = createMigrator({
      database,
      sources: options.sources,
    });
    if (previous) await migrator.upTo(previous);
    const schemaBefore = await snapshotSchema(connection);
    await options.before?.(context);

    await migrator.upTo(name);
    await expectConsistentMetadata(connection, `after applying ${name}`);
    await options.up?.(context);
    if (options.reversible === false) return;

    const rollback = await migrator.rollback();
    expect(rollback.rolledBack, 'the migrations rolled back').toEqual([name]);
    await expectConsistentMetadata(connection, `after rolling back ${name}`);
    expect(
      await snapshotSchema(connection),
      `the schema after rolling back ${name}`,
    ).toEqual(schemaBefore);
    await options.down?.(context);

    await migrator.upTo(name);
    await expectConsistentMetadata(connection, `after applying ${name} again`);
    await options.up?.(context);
  } finally {
    await testDatabase.destroy();
  }
}

async function expectConsistentMetadata(
  connection: DatabaseConnection,
  when: string,
): Promise<void> {
  connection.collections.invalidate();
  const diagnosis = await connection.collections.diagnose();
  expect(
    diagnosis.issues,
    `Collection metadata and tables disagree ${when}`,
  ).toEqual([]);
}

const BOOKKEEPING_TABLE_PREFIX = '__nocobase_';

/**
 * The schema of every table on the connection, by table, so that a rollback
 * is checked Field by Field: a `down` that drops the column it added but
 * leaves its index behind, or forgets the column altogether, changes the
 * snapshot although the list of tables is the same.
 */
async function snapshotSchema(
  connection: DatabaseConnection,
): Promise<Record<string, CollectionSchemaSnapshot>> {
  connection.collections.invalidate();
  const snapshots: Record<string, CollectionSchemaSnapshot> = {};
  let cursor: string | undefined;
  do {
    const page = await connection.collections.list({
      ...(cursor ? { cursor } : {}),
    });
    for (const item of page.items) {
      // Migration and metadata bookkeeping appears on the first run and is not part of any migration's schema.
      if (item.tableName.startsWith(BOOKKEEPING_TABLE_PREFIX)) continue;
      const snapshot = await inspectCollection(connection, item.name);
      if (snapshot) snapshots[`${item.schema}.${item.tableName}`] = snapshot;
    }
    cursor = page.nextCursor;
  } while (cursor);
  return snapshots;
}

function describeIndex(
  fields: readonly string[],
  unique: boolean | undefined,
): string {
  const kind =
    unique === undefined
      ? 'index'
      : unique
        ? 'unique index'
        : 'non-unique index';
  return `${kind} on (${fields.join(', ')})`;
}
