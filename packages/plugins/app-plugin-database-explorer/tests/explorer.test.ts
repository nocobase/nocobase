// db-test-portability: sqlite-only — the connection listing under test is static configuration naming SQLite; its queries run on test databases from @nocobase/app-testing
import type { DatabaseManager } from '@nocobase/db';
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
import { DatabaseExplorerError } from '../server/types.js';

// Read from configuration alone: listing connections opens none of them, so
// these entries never reach a database and need not match the one under test.
const config: ExplorerDatabaseConfig = {
  default: 'main',
  connections: {
    main: { dialect: 'sqlite', filename: ':memory:' },
    reporting: { dialect: 'sqlite', filename: ':memory:' },
  },
};

describe('the Explorer read helpers against a real database', () => {
  let testDatabases: ProvisionedTestDatabases;
  let testDatabase: TestDatabase;
  let database: DatabaseManager;
  // The connections the Explorer is told about, on the dialect under test.
  let databaseConfig: ExplorerDatabaseConfig;

  beforeAll(async () => {
    testDatabases = await provisionTestDatabases({
      connections: ['main', 'reporting'],
    });
    databaseConfig = {
      default: 'main',
      connections: {
        main: testDatabases.connectionConfig('main'),
        reporting: testDatabases.connectionConfig('reporting'),
      },
    };
  });

  afterAll(async () => {
    await testDatabases?.drop();
  });

  beforeEach(async () => {
    testDatabase = await testDatabases.open();
    database = testDatabase.database;
    const builder = database.connection().builder;
    await builder.createCollection('customers', (collection) => {
      collection.increments('id').primary();
      collection.string('name', { length: 120 }).notNull();
      collection.string('email').nullable();
    });
    await builder.createCollection('orders', (collection) => {
      collection.increments('id').primary();
      collection.string('orderNo').notNull();
      collection.integer('total', { defaultValue: 0 });
      collection.field({
        name: 'customer',
        type: 'belongsTo',
        target: 'customers',
        targetKey: 'id',
        foreignKey: 'customerId',
        foreignKeyType: 'integer',
      });
    });
    await database
      .connection('reporting')
      .builder.createCollection('dailyTotals', (collection) => {
        collection.increments('id').primary();
      });
  });

  afterEach(async () => {
    await testDatabase.destroy();
  });

  it('names every configured connection without opening one', () => {
    expect(listConnections(config)).toEqual({
      default: 'main',
      items: [
        {
          name: 'main',
          isDefault: true,
          dialect: 'sqlite',
          schemaManagement: 'managed',
        },
        {
          name: 'reporting',
          isDefault: false,
          dialect: 'sqlite',
          schemaManagement: 'managed',
        },
      ],
    });
  });

  it('falls back to the first connection when none is named as default', () => {
    expect(listConnections({ connections: config.connections }).default).toBe(
      'main',
    );
  });

  it('reports no default for an application with no connections', () => {
    expect(listConnections({ connections: {} })).toEqual({
      default: null,
      items: [],
    });
  });

  it('lists only the collections of the connection it was asked about', async () => {
    const main = await listCollections(database, databaseConfig, 'main');
    const reporting = await listCollections(
      database,
      databaseConfig,
      'reporting',
    );

    expect(main.items.map((item) => item.name).sort()).toEqual([
      'customers',
      'orders',
    ]);
    expect(reporting.items.map((item) => item.name)).toEqual(['dailyTotals']);
  });

  it('walks a listing through its cursor without losing or repeating a collection', async () => {
    const seen: string[] = [];
    let cursor: string | undefined;
    let pages = 0;

    do {
      const page = await listCollections(database, databaseConfig, 'main', {
        limit: 1,
        ...(cursor === undefined ? {} : { cursor }),
      });
      seen.push(...page.items.map((item) => item.name));
      cursor = page.nextCursor;
      pages += 1;
      expect(pages).toBeLessThan(10);
    } while (cursor !== undefined);

    expect(seen.sort()).toEqual(['customers', 'orders']);
  });

  it('describes a collection down to its fields', async () => {
    const detail = await readCollection(
      database,
      databaseConfig,
      'main',
      'orders',
    );
    const fields = detail.collection.collection.fields ?? [];

    expect(detail.collection.name).toBe('orders');
    expect(fields.map((field) => field.name)).toEqual(
      expect.arrayContaining(['id', 'orderNo', 'total']),
    );
    expect(fields.find((field) => field.name === 'orderNo')).toMatchObject({
      type: 'string',
      nullable: false,
    });
  });

  it('records the primary key as a constraint rather than on the field', async () => {
    // What the field table has to read to mark a key, including a composite one.
    const detail = await readCollection(
      database,
      databaseConfig,
      'main',
      'orders',
    );

    expect(detail.collection.collection.constraints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'primary', fields: ['id'] }),
      ]),
    );
    expect(
      (detail.collection.collection.fields ?? []).find(
        (field) => field.name === 'id',
      ),
    ).toMatchObject({ autoIncrement: true, nullable: false });
  });

  it('carries the relation a collection declares', async () => {
    const detail = await readCollection(
      database,
      databaseConfig,
      'main',
      'orders',
    );
    const relation = (detail.collection.collection.fields ?? []).find(
      (field) => field.type === 'belongsTo',
    );

    expect(relation).toMatchObject({
      target: 'customers',
      foreignKey: 'customerId',
    });
  });

  it('describes the physical columns behind a collection', async () => {
    const { schema } = await readPhysicalCollection(
      database,
      databaseConfig,
      'main',
      'customers',
    );

    expect(schema.name).toBe('customers');
    expect(schema.physical.tableName).toBe('customers');
    expect(schema.physical.columns.map((column) => column.columnName)).toEqual(
      expect.arrayContaining(['id', 'name', 'email']),
    );
    expect(
      schema.physical.columns.find((column) => column.columnName === 'email'),
    ).toMatchObject({ nullable: true });
  });

  it('rejects a connection the application does not configure', async () => {
    await expect(
      listCollections(database, databaseConfig, 'nope'),
    ).rejects.toMatchObject({
      code: 'CONNECTION_NOT_FOUND',
      status: 404,
    });
  });

  it.each([
    ['definition', readCollection],
    ['physical schema', readPhysicalCollection],
  ])(
    'reports a missing collection when reading its %s',
    async (_label, read) => {
      await expect(
        read(database, databaseConfig, 'main', 'missing'),
      ).rejects.toBeInstanceOf(DatabaseExplorerError);
      await expect(
        read(database, databaseConfig, 'main', 'missing'),
      ).rejects.toMatchObject({ code: 'COLLECTION_NOT_FOUND', status: 404 });
    },
  );
});
