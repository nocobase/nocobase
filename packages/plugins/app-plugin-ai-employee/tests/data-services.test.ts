import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { DatabaseManager } from '@nocobase/db';
import { createTestDatabase, type TestDatabase } from '@nocobase/db-testing';
import {
  createAppAuthorization,
  type AppAuthorization,
} from '@nocobase/app-plugin-authorization/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDataServices } from '../server/service/data-services.js';
import { dataOutput } from '../server/service/data-output.js';
import {
  dataQuerySchema,
  dataSourceQuerySchema,
} from '../server/service/data-schemas.js';
import { restrictionRules } from '@nocobase/app-plugin-authz-restriction-rules/server';
import type { DataServices } from '../server/service/data-contracts.js';

/** A collection grant as a Permission Set stores it. */
function collectionGrant(
  collection: string,
  definition: Record<string, Record<string, unknown>>,
) {
  return {
    resource: { type: 'database.collection', id: collection },
    actions: Object.entries(definition).map(([action, config]) => ({
      action,
      policy: { type: 'database', ...config },
    })),
  };
}

function recordAccessSelection(value: { key: string; params?: unknown }) {
  return { type: 'recordAccess' as const, ...value };
}

const testDatabases: TestDatabase[] = [];
afterEach(async () => {
  await Promise.all(
    testDatabases.splice(0).map((testDatabase) => testDatabase.destroy()),
  );
});

async function fixture(): Promise<{
  database: DatabaseManager;
  authorization: AppAuthorization;
  alice: DataServices;
  bob: DataServices;
}> {
  const testDatabase = await createTestDatabase({
    connections: ['main', 'other'],
  });
  testDatabases.push(testDatabase);
  const { database } = testDatabase;
  const authorizationPath = dirname(
    createRequire(import.meta.url).resolve(
      '@nocobase/app-plugin-authorization/package.json',
    ),
  );
  await database
    .createMigrator({
      directory: join(authorizationPath, 'database/migrations'),
      packageName: '@nocobase/app-plugin-authorization',
    })
    .latest();
  await database
    .createMigrator({
      directory: join(
        authorizationPath,
        '../app-plugin-authz-restriction-rules/database/migrations',
      ),
      packageName: '@nocobase/app-plugin-authz-restriction-rules',
    })
    .latest();
  const authorization = createAppAuthorization({
    connection: database.connection(),
    database,
    config: { plugins: [restrictionRules()] },
  });
  for (const source of ['main', 'other']) {
    await database.builder(source).createCollection('orders', (collection) => {
      collection.title('Orders');
      collection.string('id').primary();
      collection.string('ownerId');
      collection.string('region').title('Sales region');
      collection.string('secret').description('Private field');
      collection.decimal('amount', { precision: 30, scale: 8 });
      collection.bigInt('externalId');
      collection.datetimeTz('createdAt');
      collection.boolean('active');
      collection.text('notes');
    });
    authorization.database.collections.add({
      title: 'Collection',
      name: `${source}.orders`,
      actions: ['read'],
    });
  }
  await database.builder().createCollection('unmapped', (collection) => {
    collection.string('id').primary();
  });
  for (const row of [
    {
      id: 'a1',
      ownerId: 'alice',
      region: 'north',
      secret: 'hidden',
      amount: '100000000000000.25',
      externalId: '9007199254740993',
      createdAt: '2026-04-01T00:00:00.000Z',
      active: true,
      notes: 'a'.repeat(6000),
    },
    {
      id: 'a2',
      ownerId: 'alice',
      region: 'south',
      secret: 'hidden',
      amount: '0.00000001',
      externalId: '9007199254740994',
      createdAt: '2026-04-02T00:00:00.000Z',
      active: false,
      notes: 'short',
    },
    {
      id: 'b1',
      ownerId: 'bob',
      region: 'north',
      secret: 'hidden',
      amount: '20.00000000',
      externalId: '9007199254740995',
      createdAt: '2026-04-03T00:00:00.000Z',
      active: true,
      notes: 'short',
    },
  ])
    await database.repository('orders').createOne({ values: row });
  const permission = await authorization.permissionSets.create({
    key: 'orders-read',
    grants: [
      collectionGrant('main.orders', {
        read: {
          fields: [
            'id',
            'ownerId',
            'region',
            'amount',
            'externalId',
            'createdAt',
            'active',
            'notes',
          ],
          recordAccess: ['recordsIOwn'],
        },
      }),
    ],
  });
  for (const id of ['alice', 'bob'])
    await authorization.permissionSets.assign({
      permissionSet: permission.key,
      subject: { type: 'user', id },
    });
  const service = (id: string): DataServices =>
    createDataServices({
      database,
      authorization,
      actor: { id, roles: [], isRoot: false },
    });
  return {
    database,
    authorization,
    alice: service('alice'),
    bob: service('bob'),
  };
}

describe('actor-bound data services with a real database and authorization', () => {
  it('keeps explicit connection mappings separate and honors authenticated subject grants', async () => {
    const { alice, database, authorization } = await fixture();
    await database
      .repository('orders', 'other')
      .createOne({ values: { id: 'remote', ownerId: 'alice' } });
    const grant = await authorization.permissionSets.create({
      key: 'remote-read',
      grants: [
        collectionGrant('other.orders', {
          read: { fields: ['id'], recordAccess: ['allRecords'] },
        }),
      ],
    });
    await authorization.permissionSets.assign({
      permissionSet: grant.key,
      subject: { type: 'authenticated', id: '*' },
    });
    expect(await alice.getDataSources({})).toMatchObject({
      items: [{ name: 'main' }, { name: 'other' }],
    });
    expect(
      await alice.dataSourceQuery({
        dataSource: 'other',
        collection: 'orders',
        fields: ['id'],
      }),
    ).toMatchObject({ items: [{ id: 'remote' }] });
    expect(
      await alice.dataSourceCounting({
        dataSource: 'other',
        collection: 'orders',
      }),
    ).toEqual({ count: 1 });
  });

  it('filters discovery, fields and field search without exposing connections or unmapped tables', async () => {
    const { alice } = await fixture();
    expect(await alice.getDataSources({})).toMatchObject({
      items: [{ name: 'main' }],
    });
    expect(await alice.getCollectionNames({})).toMatchObject({
      items: [{ name: 'orders', title: 'Orders' }],
    });
    const metadata = await alice.getCollectionMetadata({
      collection: 'orders',
    });
    expect(metadata.fields.items.map((field) => field.name)).not.toContain(
      'secret',
    );
    expect(await alice.searchFieldMetadata({ query: 'secret' })).toMatchObject({
      items: [],
    });
    expect(await alice.searchFieldMetadata({ query: 'region' })).toMatchObject({
      items: [{ name: 'region', match: 'exact' }],
    });
    expect(await alice.searchFieldMetadata({ query: 'Sales' })).toMatchObject({
      items: [{ name: 'region', match: 'candidate' }],
    });
    await expect(
      alice.getCollectionMetadata({ collection: 'unmapped' }),
    ).rejects.toThrow();
  });

  it('uses identical actor record scope for detail, count and native aggregate/groupBy', async () => {
    const { alice, bob } = await fixture();
    expect(
      await alice.dataSourceQuery({
        collection: 'orders',
        fields: ['id'],
        sort: [{ field: 'id', direction: 'asc' }],
      }),
    ).toMatchObject({ items: [{ id: 'a1' }, { id: 'a2' }] });
    expect(
      await bob.dataSourceQuery({ collection: 'orders', fields: ['id'] }),
    ).toMatchObject({ items: [{ id: 'b1' }] });
    expect(await alice.dataSourceCounting({ collection: 'orders' })).toEqual({
      count: 2,
    });
    const aggregate = await alice.dataQuery({
      collection: 'orders',
      aggregates: [
        { function: 'count', alias: 'count' },
        { function: 'sum', field: 'amount', alias: 'total' },
      ],
    });
    expect(aggregate.items).toEqual([
      { count: 2, total: '100000000000000.25000001' },
    ]);
    expect(
      await alice.dataQuery({
        collection: 'orders',
        aggregates: [{ function: 'count', alias: 'count' }],
        groupBy: [{ field: 'region', values: ['north', 'south'] }],
        sort: [
          { field: 'count', direction: 'desc' },
          { field: 'region', direction: 'asc' },
        ],
      }),
    ).toMatchObject({
      items: [
        { region: 'north', count: 1 },
        { region: 'south', count: 1 },
      ],
    });
  });

  it('denies forbidden output/filter/sort/group/aggregate fields and cross-source access before data reads', async () => {
    const { alice, database } = await fixture();
    const repository = vi.spyOn(database, 'repository');
    await expect(
      alice.dataSourceQuery({ collection: 'orders', fields: ['secret'] }),
    ).rejects.toThrow();
    await expect(
      alice.dataSourceQuery({
        collection: 'orders',
        fields: ['id'],
        sort: [{ field: 'secret', direction: 'asc' }],
      }),
    ).rejects.toThrow();
    await expect(
      alice.dataSourceCounting({
        collection: 'orders',
        filter: [{ field: 'secret', operator: 'eq', value: 'hidden' }],
      }),
    ).rejects.toThrow();
    await expect(
      alice.dataQuery({
        collection: 'orders',
        aggregates: [{ function: 'min', field: 'secret', alias: 'value' }],
      }),
    ).rejects.toThrow();
    await expect(
      alice.dataQuery({
        collection: 'orders',
        aggregates: [{ function: 'count', alias: 'count' }],
        groupBy: [{ field: 'secret', values: ['hidden'] }],
      }),
    ).rejects.toThrow();
    await expect(
      alice.dataSourceQuery({
        dataSource: 'other',
        collection: 'orders',
        fields: ['id'],
      }),
    ).rejects.toThrow();
    expect(repository).not.toHaveBeenCalled();
  });

  it('fails closed without authorization, for unmapped resources and root flags', async () => {
    const { database, authorization } = await fixture();
    const root = { id: 'root', roles: ['root'], isRoot: true };
    await expect(
      createDataServices({ database, actor: root }).getDataSources({}),
    ).rejects.toThrow();
    await expect(
      createDataServices({
        database,
        actor: root,
        authorization,
      }).dataSourceCounting({ collection: 'orders' }),
    ).rejects.toThrow();
    expect(
      await createDataServices({
        database,
        actor: root,
        authorization,
      }).getDataSources({}),
    ).toMatchObject({ items: [] });
    await expect(
      createDataServices({
        database,
        actor: root,
        authorization,
      }).dataSourceCounting({ collection: 'unmapped' }),
    ).rejects.toThrow();
  });

  it('keeps precision, bounded pagination/text and exact offset-bearing date boundaries', async () => {
    const { alice } = await fixture();
    const first = await alice.dataSourceQuery({
      collection: 'orders',
      fields: ['id', 'externalId', 'amount', 'notes'],
      sort: [{ field: 'id', direction: 'asc' }],
      limit: 1,
    });
    expect(first).toMatchObject({
      hasMore: true,
      truncated: true,
      items: [
        {
          id: 'a1',
          externalId: '9007199254740993',
          // Every significant digit survives; a dialect with a native decimal
          // type returns the value padded to the column's scale of 8.
          amount: expect.stringMatching(/^100000000000000\.250*$/),
        },
      ],
    });
    expect(first.items[0].notes).toHaveLength(4096);
    expect(
      await alice.dataSourceQuery({
        collection: 'orders',
        fields: ['id'],
        sort: [{ field: 'id', direction: 'asc' }],
        limit: 1,
        offset: 1,
      }),
    ).toMatchObject({ hasMore: false, items: [{ id: 'a2' }] });
    expect(
      await alice.dataSourceCounting({
        collection: 'orders',
        filter: [
          {
            field: 'createdAt',
            operator: 'dateNotBefore',
            value: '2026-04-01T08:00:00+08:00',
          },
          {
            field: 'createdAt',
            operator: 'dateBefore',
            value: '2026-04-02T00:00:00Z',
          },
        ],
      }),
    ).toEqual({ count: 1 });
    expect(
      await alice.dataSourceCounting({
        collection: 'orders',
        filter: [{ field: 'active', operator: 'eq', value: true }],
      }),
    ).toEqual({ count: 1 });
    await expect(
      alice.dataSourceCounting({
        collection: 'orders',
        filter: [
          { field: 'createdAt', operator: 'dateOn', value: '2026-04-01' },
        ],
      }),
    ).rejects.toThrow();
    expect(
      await alice.dataQuery({
        collection: 'orders',
        filter: [{ field: 'id', operator: 'eq', value: 'absent' }],
        aggregates: [
          { function: 'count', alias: 'count' },
          { function: 'sum', field: 'amount', alias: 'total' },
        ],
      }),
    ).toMatchObject({ items: [{ count: 0, total: null }] });
  });

  it('applies independent target scopes and field permissions to bounded one-hop relations', async () => {
    const { alice, database, authorization } = await fixture();
    await database.builder().createCollection('lines', (collection) => {
      collection.string('id').primary();
      collection.string('orderId');
      collection.string('ownerId');
      collection.string('description');
      collection.string('secret');
    });
    await database.builder().alterCollection('orders', (collection) => {
      collection
        .hasMany('lines', 'lines')
        .sourceKey('id')
        .foreignKey('orderId');
    });
    // A new registration is used because authorization mappings are immutable.
    const relationAuthz = createAppAuthorization({
      database,
      connection: database.connection(),
    });
    relationAuthz.database.collections.add({
      title: 'Collection',
      name: 'main.orders',
      actions: ['read'],
    });
    relationAuthz.database.collections.add({
      title: 'Collection',
      name: 'main.lines',
      actions: ['read'],
    });
    const permission = await relationAuthz.permissionSets.create({
      key: 'lines-read',
      grants: [
        collectionGrant('main.orders', {
          read: {
            fields: ['id', 'ownerId'],
            relations: {
              lines: {
                fields: ['id', 'orderId', 'ownerId', 'description'],
                recordAccess: ['recordsIOwn'],
              },
            },
            recordAccess: ['recordsIOwn'],
          },
        }),
        collectionGrant('main.lines', {
          read: {
            fields: ['id', 'orderId', 'ownerId', 'description'],
            recordAccess: ['recordsIOwn'],
          },
        }),
      ],
    });
    await relationAuthz.permissionSets.assign({
      permissionSet: permission.key,
      subject: { type: 'user', id: 'alice' },
    });
    for (const row of [
      {
        id: 'l1',
        orderId: 'a1',
        ownerId: 'alice',
        description: 'visible',
        secret: 'private',
      },
      {
        id: 'l2',
        orderId: 'a1',
        ownerId: 'bob',
        description: 'invisible',
        secret: 'private',
      },
    ])
      await database.repository('lines').createOne({ values: row });
    const service = createDataServices({
      database,
      authorization: relationAuthz,
      actor: { id: 'alice', roles: [], isRoot: false },
    });
    expect(
      await service.getCollectionMetadata({ collection: 'orders' }),
    ).toMatchObject({
      fields: {
        items: expect.arrayContaining([
          {
            name: 'lines',
            type: 'hasMany',
            relation: { target: 'lines', cardinality: 'many', queryable: true },
          },
        ]),
      },
    });
    expect(
      await service.dataSourceQuery({
        collection: 'orders',
        fields: ['id'],
        filter: [{ field: 'id', operator: 'eq', value: 'a1' }],
        relations: [
          { relation: 'lines', fields: ['id', 'description'], limit: 1 },
        ],
      }),
    ).toMatchObject({
      items: [{ id: 'a1', lines: [{ id: 'l1', description: 'visible' }] }],
    });
    await expect(
      service.dataSourceQuery({
        collection: 'orders',
        fields: ['id'],
        relations: [{ relation: 'lines', fields: ['secret'] }],
      }),
    ).rejects.toThrow();
    await expect(
      alice.dataSourceQuery({
        collection: 'orders',
        fields: ['id'],
        relations: [{ relation: 'lines', fields: ['id'] }],
      }),
    ).rejects.toThrow();
    // The existing authorization has no target registration; the relation stays hidden.
    expect(
      (
        await createDataServices({
          database,
          authorization,
          actor: { id: 'alice', roles: [], isRoot: false },
        }).getCollectionMetadata({ collection: 'orders' })
      ).fields.items.map((field) => field.name),
    ).not.toContain('lines');
  });

  it('honors restriction rules in all three query paths', async () => {
    const { alice, authorization } = await fixture();
    await authorization.restrictionRules.create({
      key: 'north-only',
      resource: { type: 'database.collection', id: 'main.orders' },
      actions: [
        {
          action: 'read',
          selection: recordAccessSelection({
            key: 'customFilter',
            params: {
              filter: {
                kind: 'condition',
                path: ['region'],
                operator: '$eq',
                value: 'north',
              },
            },
          }),
        },
      ],
      subjects: [{ type: 'user', id: 'alice' }],
    });
    expect(
      await alice.dataSourceQuery({ collection: 'orders', fields: ['id'] }),
    ).toMatchObject({ items: [{ id: 'a1' }] });
    expect(await alice.dataSourceCounting({ collection: 'orders' })).toEqual({
      count: 1,
    });
    expect(
      await alice.dataQuery({
        collection: 'orders',
        aggregates: [{ function: 'count', alias: 'count' }],
      }),
    ).toMatchObject({ items: [{ count: 1 }] });
  });
});

describe('data input and output safety', () => {
  it('bounds the total input before authorization or database access', async () => {
    const { alice, database } = await fixture();
    const repository = vi.spyOn(database, 'repository');
    await expect(
      alice.dataSourceCounting({
        collection: 'orders',
        filter: [
          {
            field: 'id',
            operator: 'in',
            value: Array.from({ length: 100 }, () => 'x'.repeat(4096)),
          },
        ],
      }),
    ).rejects.toThrow('64 KiB');
    expect(repository).not.toHaveBeenCalled();
  });

  it('captures identity, rejects unsafe actor IDs and does not infer a local timezone', async () => {
    const { database, authorization } = await fixture();
    const actor = { id: 'alice', roles: [] as string[], isRoot: false };
    const service = createDataServices({ database, authorization, actor });
    actor.id = 'bob';
    expect(await service.dataSourceCounting({ collection: 'orders' })).toEqual({
      count: 2,
    });
    await expect(
      createDataServices({
        database,
        authorization,
        actor: { id: 9007199254740992, roles: [], isRoot: true },
      }).getDataSources({}),
    ).rejects.toThrow();
    let timezone = 'Asia/Shanghai';
    const local = createDataServices({
      database,
      authorization,
      actor: { ...actor, id: 'alice' },
      get timezone() {
        return timezone;
      },
    });
    expect(await local.dataSourceCounting({ collection: 'orders' })).toEqual({
      count: 2,
    });
    expect(
      await local.dataSourceQuery({
        collection: 'orders',
        fields: ['id'],
        filter: [
          {
            field: 'createdAt',
            operator: 'dateNotBefore',
            value: '2026-04-01T08:00:00+08:00',
          },
          {
            field: 'createdAt',
            operator: 'dateBefore',
            value: '2026-04-02T08:00:00+08:00',
          },
        ],
      }),
    ).toMatchObject({ items: [{ id: 'a1' }], timezone: 'Asia/Shanghai' });
    timezone = 'America/New_York';
    expect(
      await local.dataSourceQuery({ collection: 'orders', fields: ['id'] }),
    ).toMatchObject({ timezone: 'America/New_York' });
    timezone = 'Invalid/Zone';
    await expect(
      local.dataSourceCounting({ collection: 'orders' }),
    ).rejects.toThrow('Invalid execution timezone');
  });

  it('enforces empty and NULL-membership record policies without widening them', async () => {
    const { alice, authorization } = await fixture();
    await authorization.restrictionRules.create({
      key: 'nothing',
      resource: { type: 'database.collection', id: 'main.orders' },
      actions: [
        {
          action: 'read',
          selection: recordAccessSelection({
            key: 'customFilter',
            params: { filter: false },
          }),
        },
      ],
      subjects: [{ type: 'user', id: 'alice' }],
    });
    // An empty effective record scope returns nothing and never widens.
    expect(
      await alice.dataSourceCounting({ collection: 'orders' }),
    ).toMatchObject({ count: 0 });
    expect(
      await alice.dataSourceQuery({ collection: 'orders', fields: ['id'] }),
    ).toMatchObject({ items: [] });
    expect(
      await alice.dataQuery({
        collection: 'orders',
        aggregates: [{ function: 'count', alias: 'count' }],
      }),
    ).toMatchObject({ items: [{ count: 0 }] });
    const { alice: second, authorization: secondAuthz } = await fixture();
    await secondAuthz.restrictionRules.create({
      key: 'null-membership',
      resource: { type: 'database.collection', id: 'main.orders' },
      actions: [
        {
          action: 'read',
          selection: recordAccessSelection({
            key: 'customFilter',
            params: {
              filter: { $and: [{ region: { $in: [null, 'north'] } }] },
            },
          }),
        },
      ],
      subjects: [{ type: 'user', id: 'alice' }],
    });
    await expect(
      second.dataSourceCounting({ collection: 'orders' }),
    ).rejects.toThrow();
  });
  it('rejects raw SQL, ASTs, identities, relation paths and excessive bounds', () => {
    const base = { collection: 'orders', fields: ['id'] };
    for (const patch of [
      { sql: 'select *' },
      { actor: { id: 'root' } },
      { fields: ['secret.path'] },
      { limit: 101 },
      { offset: 10001 },
      { filter: { kind: 'filter', root: {} } },
      {
        filter: [
          {
            field: 'id',
            operator: 'eq',
            value: { kind: 'variable', path: '$actor.id' },
          },
        ],
      },
      { collection: '__proto__' },
      { filter: [{ field: 'id', operator: 'eq', value: 9007199254740992 }] },
    ])
      expect(
        dataSourceQuerySchema.safeParse({ ...base, ...patch }).success,
      ).toBe(false);
    expect(
      dataQuerySchema.safeParse({
        collection: 'orders',
        aggregates: [{ function: 'count', alias: 'n' }],
        groupBy: [
          {
            field: 'id',
            values: Array.from({ length: 11 }, (_, index) => index),
          },
          {
            field: 'region',
            values: Array.from({ length: 10 }, (_, index) => index),
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      dataQuerySchema.safeParse({
        collection: 'orders',
        aggregates: [{ function: 'count', alias: 'id' }],
        groupBy: [{ field: 'id', values: ['a'] }],
      }).success,
    ).toBe(false);
  });
  it('serializes bigint and rejects unsafe numeric output instead of rounding', () => {
    expect(
      dataOutput([
        { id: 9007199254740993n, amount: '12345678901234567890.001' },
      ]),
    ).toEqual({
      items: [{ id: '9007199254740993', amount: '12345678901234567890.001' }],
      truncated: false,
    });
    expect(() => dataOutput([{ id: 9007199254740992 }])).toThrow('safely');
    expect(() => dataOutput([{ value: Buffer.from('private') }])).toThrow();
  });
});

describe('empty authorization predicates', () => {
  it.each(['membership', 'disjunction'] as const)(
    'rejects nested empty %s before any data read',
    async (kind) => {
      const { alice, database, authorization } = await fixture();
      const filter =
        kind === 'membership' ? { ownerId: { $in: [] } } : { $or: [] };
      await authorization.restrictionRules.create({
        key: 'empty-scope',
        resource: { type: 'database.collection', id: 'main.orders' },
        actions: [
          {
            action: 'read',
            selection: recordAccessSelection({
              key: 'customFilter',
              params: { filter: { $and: [filter] } },
            }),
          },
        ],
        subjects: [{ type: 'user', id: 'alice' }],
      });
      const repository = vi.spyOn(database, 'repository');
      await expect(
        alice.dataSourceQuery({ collection: 'orders', fields: ['id'] }),
      ).rejects.toThrow();
      await expect(
        alice.dataSourceCounting({ collection: 'orders' }),
      ).rejects.toThrow();
      await expect(
        alice.dataQuery({
          collection: 'orders',
          aggregates: [{ function: 'count', alias: 'n' }],
        }),
      ).rejects.toThrow();
      expect(repository).not.toHaveBeenCalled();
    },
  );

  it('rejects empty user memberships', async () => {
    const { alice } = await fixture();
    await expect(
      alice.dataSourceCounting({
        collection: 'orders',
        filter: [{ field: 'id', operator: 'in', value: [] }],
      }),
    ).rejects.toThrow();
  });
});
