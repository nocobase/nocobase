import { permissionSetsPlugin } from '@nocobase/authorization';
import { createDatabaseManager, type DatabaseConnection } from '@nocobase/db';
import {
  createDatabaseTest,
  createTestDatabase,
} from '@nocobase/app-testing/server';
import type { Knex } from 'knex';
import { afterEach, expect, vi } from 'vitest';
import {
  collectionResolver,
  describeCollection,
} from '../../../server/database/collections.js';
import {
  authorizeAs,
  createAuthorization,
  databaseTestPlugin,
} from '../../helpers/authorization-fixture.js';
import { MockPermissionSetStore } from '../../helpers/mock-permission-set-store.js';

const test = createDatabaseTest();

afterEach(() => vi.restoreAllMocks());

async function createDocuments(connection: DatabaseConnection) {
  await connection.builder.createCollection('documents', (collection) => {
    collection.string('recordId', { length: 64 }).primary().notNull();
    collection.string('title', { length: 64 });
  });
}

test('preserves logical primary keys, defaults, composite keys and the id fallback', async ({
  connection,
}) => {
  await connection.builder.createCollections([
    {
      name: 'automatic',
      definition: (collection) => collection.increments('recordId').primary(),
    },
    {
      name: 'manual',
      definition: (collection) =>
        collection.string('recordId', { length: 64 }).primary().notNull(),
    },
    ...[null, '', 'generated'].map((value, index) => ({
      name: `default${index}`,
      definition: {
        fields: [
          { name: 'recordId', type: 'string', length: 64, defaultValue: value },
        ],
        constraints: [{ type: 'primary' as const, fields: ['recordId'] }],
      },
    })),
    {
      name: 'zeroDefault',
      definition: {
        fields: [{ name: 'recordId', type: 'integer', defaultValue: 0 }],
        constraints: [{ type: 'primary', fields: ['recordId'] }],
      },
    },
    {
      name: 'composite',
      definition: {
        fields: [
          { name: 'otherId', type: 'string', length: 64 },
          { name: 'recordId', type: 'string', length: 64, defaultValue: '' },
        ],
        constraints: [{ type: 'primary', fields: ['recordId', 'otherId'] }],
      },
    },
    {
      name: 'withoutPrimary',
      definition: (collection) => collection.string('title', { length: 64 }),
    },
    {
      name: 'fallbackDefault',
      definition: (collection) =>
        collection.string('id', { length: 64 }).defaultTo('fallback'),
    },
  ]);
  await connection.builder.createViewCollection('documentView', {
    fields: [{ name: 'recordId', type: 'string', length: 64 }],
    view: { as: { from: 'manual', select: ['recordId'] } },
  });

  for (const [name, primaryKey, generatedPrimaryKey] of [
    ['automatic', 'recordId', true],
    ['manual', 'recordId', false],
    ['default0', 'recordId', true],
    ['default1', 'recordId', true],
    ['default2', 'recordId', true],
    ['zeroDefault', 'recordId', true],
    ['composite', 'recordId', true],
    ['withoutPrimary', 'id', false],
    ['fallbackDefault', 'id', true],
    ['documentView', 'id', false],
  ] as const) {
    await expect(describeCollection(connection, name)).resolves.toMatchObject({
      name,
      primaryKey,
      generatedPrimaryKey,
    });
  }
  await expect(
    describeCollection(connection, 'missing'),
  ).resolves.toBeUndefined();
});

// Some dialects prohibit generated primary keys. Feed their physical attributes
// through the real resolver to cover the authorization contract on every dialect.
for (const kind of ['expressionDefault', 'generated'] as const) {
  test(`retains ${kind} from the physical schema in the resolved definition`, async ({
    connection,
  }) => {
    await createDocuments(connection);
    const inspect = connection.schemaInspector.getPhysicalCollection.bind(
      connection.schemaInspector,
    );
    vi.spyOn(
      connection.schemaInspector,
      'getPhysicalCollection',
    ).mockImplementation(async (identity) => {
      const physical = await inspect(identity);
      return (
        physical && {
          ...physical,
          columns: physical.columns.map((column) =>
            column.columnName === 'record_id'
              ? {
                  ...column,
                  ...(kind === 'expressionDefault'
                    ? { default: { expression: "('generated' || 'key')" } }
                    : {
                        generated: { expression: "'generated'", stored: true },
                      }),
                }
              : column,
          ),
        }
      );
    });
    connection.collections.invalidate();
    await expect(
      describeCollection(connection, 'documents'),
    ).resolves.toMatchObject({
      primaryKey: 'recordId',
      generatedPrimaryKey: true,
    });
  });
}

test('warm authorization does not issue database statements or inspect the schema', async ({
  connection,
}) => {
  await createDocuments(connection);
  const resource = { type: 'database.collection', id: 'documents' };
  const store = new MockPermissionSetStore({
    permissionSets: [
      {
        key: 'reader',
        grants: [
          {
            resource,
            actions: [
              {
                action: 'read',
                policy: {
                  type: 'database',
                  fields: '*',
                  recordAccess: ['allRecords'],
                },
              },
            ],
          },
        ],
      },
    ],
    assignments: [
      {
        id: 'alice-reader',
        permissionSet: 'reader',
        subject: { type: 'user', id: 'alice' },
      },
    ],
  });
  const authz = createAuthorization({
    connection,
    plugins: [permissionSetsPlugin({ store }), databaseTestPlugin('documents')],
  });
  const request = {
    principal: { type: 'user', id: 'alice' },
    resource,
    action: 'read',
    params: { fields: { output: ['recordId', 'title'] } },
  };
  const first = await authorizeAs(authz, request);
  expect(first.effect).toBe('conditional');
  const knex = await connection.client<Knex>();
  const statements: string[] = [];
  const listener = ({ sql }: { sql: string }) => statements.push(sql);
  const physical = vi.spyOn(connection.collections, 'getPhysical');
  knex.on('query', listener);
  try {
    const decisions = await Promise.all(
      Array.from({ length: 6 }, () => authorizeAs(authz, request)),
    );
    expect(decisions).toEqual(Array.from({ length: 6 }, () => first));
    expect(statements).toHaveLength(0);
    expect(physical).not.toHaveBeenCalled();
  } finally {
    knex.off('query', listener);
  }
  const described = await describeCollection(connection, 'documents');
  (described?.fields as string[]).push('injected');
  expect(
    (await describeCollection(connection, 'documents'))?.fields,
  ).not.toContain('injected');
});

test('preserves create and update permissions for defaulted and manual string keys', async ({
  connection,
}) => {
  await createDocuments(connection);
  await connection.builder.createCollection(
    'generatedDocuments',
    (collection) => {
      collection
        .string('recordId', { length: 64 })
        .primary()
        .notNull()
        .defaultTo('generated');
      collection.string('title', { length: 64 });
    },
  );
  const store = new MockPermissionSetStore({
    permissionSets: [
      {
        key: 'writer',
        grants: ['documents', 'generatedDocuments'].map((id) => ({
          resource: { type: 'database.collection', id },
          actions: ['read', 'create', 'update'].map((action) => ({
            action,
            policy: {
              type: 'database',
              fields: '*',
              recordAccess: ['allRecords'],
            },
          })),
        })),
      },
    ],
    assignments: [
      {
        id: 'alice-writer',
        permissionSet: 'writer',
        subject: { type: 'user', id: 'alice' },
      },
    ],
  });
  const authorization = createAuthorization({
    connection,
    plugins: [
      permissionSetsPlugin({ store }),
      databaseTestPlugin('documents', 'generatedDocuments'),
    ],
  });
  const identity = authorization.for({
    principal: { type: 'user', id: 'alice' },
  });
  const manual = await authorization.database.policyFor('documents', identity);
  const generated = await authorization.database.policyFor(
    'generatedDocuments',
    identity,
  );
  expect(manual.create).toMatchObject({ fields: ['recordId', 'title'] });
  expect(generated.create).toMatchObject({ fields: ['title'] });
  expect(generated.update).toMatchObject({ fields: ['recordId', 'title'] });
  await expect(
    connection
      .repository('documents')
      .withPolicy(manual)
      .createOne({ values: { recordId: 'manual', title: 'Manual' } }),
  ).resolves.toMatchObject({ record: { recordId: 'manual' } });
  await expect(
    connection
      .repository('generatedDocuments')
      .withPolicy(generated)
      .createOne({ values: { title: 'Generated' } }),
  ).resolves.toMatchObject({ record: { recordId: 'generated' } });
  await expect(
    connection
      .repository('generatedDocuments')
      .withPolicy(generated)
      .createOne({ values: { recordId: 'injected', title: 'Rejected' } }),
  ).rejects.toThrow();
});

test('uses each data source definition without leaking same-named collections', async ({
  connection,
}) => {
  await createDocuments(connection);
  const other = await createTestDatabase();
  try {
    await other.connection.builder.createCollection('documents', (collection) =>
      collection.increments('id').primary(),
    );
    const resolve = collectionResolver(connection, other.database);
    await expect(resolve('documents')).resolves.toMatchObject({
      primaryKey: 'recordId',
      generatedPrimaryKey: false,
    });
    await expect(resolve('main.documents')).resolves.toMatchObject({
      name: 'main.documents',
      fields: ['id'],
      primaryKey: 'id',
      generatedPrimaryKey: true,
    });
  } finally {
    await other.destroy();
  }
});

test('observes committed defaults and isolates rolled back changes', async ({
  connection,
}) => {
  await createDocuments(connection);
  expect(
    (await describeCollection(connection, 'documents'))?.generatedPrimaryKey,
  ).toBe(false);
  await connection.transaction(async (transaction) => {
    await transaction.builder.dropCollection('documents');
    await transaction.builder.createCollection('documents', (collection) => {
      collection
        .string('recordId', { length: 64 })
        .primary()
        .notNull()
        .defaultTo('committed');
      collection.string('title', { length: 64 });
    });
    expect(
      (await describeCollection(transaction, 'documents'))?.generatedPrimaryKey,
    ).toBe(true);
    expect(
      (await describeCollection(connection, 'documents'))?.generatedPrimaryKey,
    ).toBe(false);
  });
  expect(
    (await describeCollection(connection, 'documents'))?.generatedPrimaryKey,
  ).toBe(true);
  await expect(
    connection.transaction(async (transaction) => {
      await transaction.builder.addField('documents', {
        name: 'privateField',
        type: 'integer',
      });
      expect(
        (await describeCollection(transaction, 'documents'))?.fields,
      ).toContain('privateField');
      throw new Error('rollback');
    }),
  ).rejects.toThrow('rollback');
  expect(
    (await describeCollection(connection, 'documents'))?.fields,
  ).not.toContain('privateField');
});

test('isolates savepoint rollback and publishes released changes only on commit', async ({
  connection,
}) => {
  await createDocuments(connection);
  await describeCollection(connection, 'documents');
  await connection.transaction(async (transaction) => {
    await describeCollection(transaction, 'documents');
    await expect(
      transaction.transaction(async (savepoint) => {
        await savepoint.builder.addField('documents', {
          name: 'rolledBack',
          type: 'integer',
        });
        expect(
          (await describeCollection(savepoint, 'documents'))?.fields,
        ).toContain('rolledBack');
        throw new Error('rollback savepoint');
      }),
    ).rejects.toThrow('rollback savepoint');
    expect(
      (await describeCollection(transaction, 'documents'))?.fields,
    ).not.toContain('rolledBack');
    await transaction.transaction(async (savepoint) => {
      await savepoint.builder.addField('documents', {
        name: 'released',
        type: 'integer',
      });
      expect(
        (await describeCollection(savepoint, 'documents'))?.fields,
      ).toContain('released');
    });
    expect(
      (await describeCollection(transaction, 'documents'))?.fields,
    ).toContain('released');
    expect(
      (await describeCollection(connection, 'documents'))?.fields,
    ).not.toContain('released');
  });
  expect((await describeCollection(connection, 'documents'))?.fields).toContain(
    'released',
  );
});

test('refreshes after another connection changes metadata and keeps explicit invalidation', async ({
  connection,
  testDatabases,
}) => {
  await createDocuments(connection);
  await describeCollection(connection, 'documents');
  const writer = createDatabaseManager({
    connections: { main: testDatabases.connectionConfig() },
  });
  try {
    await writer.connect();
    await writer.connection().builder.addField('documents', {
      name: 'externalField',
      type: 'integer',
    });
    // Root definitions live until invalidation; a new transaction checks the
    // shared metadata version and inspects its own physical schema.
    await connection.transaction(async (transaction) => {
      expect(
        (await describeCollection(transaction, 'documents'))?.fields,
      ).toContain('externalField');
    });
    connection.collections.invalidate();
    expect(
      (await describeCollection(connection, 'documents'))?.fields,
    ).toContain('externalField');
    await writer
      .connection()
      .collectionMetadata.updateField('documents', 'title', {
        title: 'Changed elsewhere',
      });
    await connection.transaction(async (transaction) => {
      expect(
        (await describeCollection(transaction, 'documents'))?.primaryKey,
      ).toBe('recordId');
      expect(
        (await transaction.collections.get('documents'))?.fields?.find(
          (field) => field.name === 'title',
        )?.title,
      ).toBe('Changed elsewhere');
    });
  } finally {
    await writer.destroy();
  }
});

test('keeps concurrent root reads separate from an uncommitted schema change', async ({
  connection,
}) => {
  await createDocuments(connection);
  await describeCollection(connection, 'documents');
  const ready = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const write = connection.transaction(async (transaction) => {
    try {
      await transaction.builder.addField('documents', {
        name: 'pending',
        type: 'integer',
      });
      expect(
        (await describeCollection(transaction, 'documents'))?.fields,
      ).toContain('pending');
      ready.resolve();
      await release.promise;
    } catch (error) {
      ready.reject(error);
      throw error;
    }
  });
  try {
    await ready.promise;
    const reads = await Promise.all(
      Array.from({ length: 4 }, () =>
        describeCollection(connection, 'documents'),
      ),
    );
    for (const read of reads) expect(read?.fields).not.toContain('pending');
  } finally {
    release.resolve();
    await write;
  }
  expect((await describeCollection(connection, 'documents'))?.fields).toContain(
    'pending',
  );
});

test('retains live physical reads and transaction inspection after external DDL', async ({
  connection,
}) => {
  await createDocuments(connection);
  await describeCollection(connection, 'documents');
  const physical = await connection.collections.getPhysical('documents');
  const knex = await connection.client<Knex>();
  await knex.schema.alterTable(physical!.tableName, (table) =>
    table.integer('raw_field'),
  );
  expect(
    (await connection.collections.getPhysical('documents'))?.columns.map(
      (column) => column.columnName,
    ),
  ).toContain('raw_field');
  expect(
    (await describeCollection(connection, 'documents'))?.fields,
  ).not.toContain('rawField');
  await connection.transaction(async (transaction) => {
    expect(
      (await describeCollection(transaction, 'documents'))?.fields,
    ).toContain('rawField');
  });
  connection.collections.invalidate();
  expect((await describeCollection(connection, 'documents'))?.fields).toContain(
    'rawField',
  );
});
