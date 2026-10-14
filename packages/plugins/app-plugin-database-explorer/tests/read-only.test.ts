import {
  createDatabaseManager,
  type DatabaseConnection,
  type DatabaseManager,
  type PhysicalCollectionSchema,
} from '@nocobase/db';
import {
  provisionTestDatabases,
  type ProvisionedTestDatabases,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import {
  listCollections,
  listConnections,
  readCollection,
  readPhysicalCollection,
  type ExplorerDatabaseConfig,
} from '../server/explorer.js';

const BOOKKEEPING_TABLE = '__nocobase_collection_metadata';

/**
 * What "read-only" is actually worth here.
 *
 * The Explorer issues no write of its own, but reading a Collection
 * initializes the Collection registry, and on a managed connection the
 * registry's metadata store creates its metadata and cache-version tables
 * when missing, including the initial version row. Business Collections and
 * their rows remain unchanged. Once initialized, reading also leaves every
 * bookkeeping row unchanged.
 *
 * These tests state that boundary rather than hiding it behind a warm-up read,
 * so a change that widens it fails here instead of on someone's database.
 */
describe('reading never changes a database', () => {
  let testDatabases: ProvisionedTestDatabases;
  let testDatabase: TestDatabase;
  let database: DatabaseManager;
  let config: ExplorerDatabaseConfig;

  beforeAll(async () => {
    testDatabases = await provisionTestDatabases();
    config = {
      default: 'main',
      connections: { main: testDatabases.connectionConfig() },
    };
  });

  afterAll(async () => {
    await testDatabases?.drop();
  });

  beforeEach(async () => {
    testDatabase = await testDatabases.open();
    database = testDatabase.database;
    await database
      .connection()
      .builder.createCollection('customers', (collection) => {
        collection.increments('id').primary();
        collection.string('name').notNull();
      });
    await database
      .connection()
      .repository('customers')
      .createOne({ values: { name: 'Ada' } });
  });

  afterEach(async () => {
    await testDatabase.destroy();
  });

  it('adds only metadata bookkeeping tables on a first read', async () => {
    // A database NocoBase has never touched: freshly provisioned and opened by
    // a manager of its own, without the reset a test database gets, and the
    // table is created with plain SQL, so the Collection builder never runs
    // and the metadata store is genuinely absent. Initializing bookkeeping
    // must leave the existing business table untouched.
    const untouched = await provisionTestDatabases();
    const virginConfig: ExplorerDatabaseConfig = {
      default: 'main',
      connections: { main: untouched.connectionConfig() },
    };
    const virgin = createDatabaseManager(virginConfig);
    try {
      const connection = virgin.connection();
      const client = await connection.client<{
        raw: (sql: string) => Promise<unknown>;
      }>();
      await client.raw(
        'create table invoices (id integer primary key, total integer not null)',
      );
      const before = await tableNames(connection);
      expect(before).toEqual(['invoices']);

      const collections = await listCollections(virgin, virginConfig, 'main');
      expect(collections.items.map((item) => item.name)).toEqual(['invoices']);

      const added = (await tableNames(connection)).filter(
        (name) => !before.includes(name),
      );
      expect(added).toEqual([
        BOOKKEEPING_TABLE,
        expect.stringMatching(
          /^__nocobase_collection_metadata_cache_[a-f0-9]{8}$/,
        ),
      ]);
      // The foreign table itself is untouched.
      expect(
        await connection.query.selectFrom('invoices').selectAll().execute(),
      ).toEqual([]);
    } finally {
      try {
        await virgin.destroy();
      } finally {
        await untouched.drop();
      }
    }
  });

  it('leaves the schema identical once bookkeeping is initialized', async () => {
    await listCollections(database, config, 'main');
    const before = await schemaSnapshot(database.connection());

    listConnections(config);
    await listCollections(database, config, 'main');
    await readCollection(database, config, 'main', 'customers');
    await readPhysicalCollection(database, config, 'main', 'customers');

    expect(await schemaSnapshot(database.connection())).toEqual(before);
  });

  it('leaves the rows of every table untouched, bookkeeping included', async () => {
    // Every table, not just the fixture's: a regression that wrote a metadata
    // row on read would pass a check that only looked at `customers`.
    await listCollections(database, config, 'main');
    const before = await allRows(database.connection());
    expect(Object.keys(before)).toContain(BOOKKEEPING_TABLE);
    expect(before.customers).toHaveLength(1);

    await listCollections(database, config, 'main');
    await readCollection(database, config, 'main', 'customers');
    await readPhysicalCollection(database, config, 'main', 'customers');

    expect(await allRows(database.connection())).toEqual(before);
  });
});

/** Every physical table and view on the connection, sorted by name. */
async function physicalTables(
  connection: DatabaseConnection,
): Promise<{ tableName: string; schema: string }[]> {
  const tables: { tableName: string; schema: string }[] = [];
  let cursor: string | undefined;
  do {
    const page = await connection.schemaInspector.listPhysicalCollections({
      ...(cursor === undefined ? {} : { cursor }),
    });
    for (const { tableName, schema } of page.items) {
      tables.push({ tableName, schema });
    }
    cursor = page.nextCursor;
  } while (cursor !== undefined);
  return tables.sort((left, right) =>
    left.tableName.localeCompare(right.tableName),
  );
}

async function tableNames(connection: DatabaseConnection): Promise<string[]> {
  return (await physicalTables(connection)).map(({ tableName }) => tableName);
}

/** The inspected structure of every table: columns, keys, indexes and constraints. */
async function schemaSnapshot(
  connection: DatabaseConnection,
): Promise<readonly (PhysicalCollectionSchema | undefined)[]> {
  const snapshot: (PhysicalCollectionSchema | undefined)[] = [];
  for (const table of await physicalTables(connection)) {
    snapshot.push(
      await connection.schemaInspector.getPhysicalCollection(table),
    );
  }
  return snapshot;
}

async function allRows(
  connection: DatabaseConnection,
): Promise<Record<string, unknown[]>> {
  const snapshot: Record<string, unknown[]> = {};
  for (const name of await tableNames(connection)) {
    const rows = await connection.query.selectFrom(name).selectAll().execute();
    // Without an order the database may return rows in any order; what is
    // compared is which rows exist.
    snapshot[name] = rows
      .map((row) => ({ row, key: JSON.stringify(row) }))
      .sort((left, right) => left.key.localeCompare(right.key))
      .map(({ row }) => row);
  }
  return snapshot;
}
