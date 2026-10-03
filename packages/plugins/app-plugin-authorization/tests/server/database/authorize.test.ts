import { defineRecordAccess } from '@nocobase/authorization/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { DatabaseConnection } from '@nocobase/db';
import { type TestDatabase } from '@nocobase/app-testing/server';
import {
  defaultAccessPlugin,
  permissionSetsPlugin,
  restrictionRulesPlugin,
  sharingRulesPlugin,
  type RestrictionRule,
  type SharingRule,
  type DefaultAccessRule,
} from '@nocobase/authorization';
import { condition } from '../../../server/database/scope.js';
import { databasePlugin as createDatabasePlugin } from '../../../server/database/plugin.js';
import {
  authorizeAs,
  canAs,
  createAuthorization,
  databaseTestPlugin,
  MemoryRuleStore,
} from '../../helpers/authorization-fixture.js';
import { MockPermissionSetStore } from '../../helpers/mock-permission-set-store.js';
import {
  createOrdersDatabase,
  orderFields,
} from '../../helpers/orders-database.js';

class MockSharingRuleStore extends MemoryRuleStore<SharingRule> {}
class MockRestrictionRuleStore extends MemoryRuleStore<RestrictionRule> {}
class MockDefaultAccessStore extends MemoryRuleStore<DefaultAccessRule> {}

let testDatabase: TestDatabase;
let connection: DatabaseConnection;

beforeAll(async () => {
  testDatabase = await createOrdersDatabase();
  connection = testDatabase.connection;
});

afterAll(async () => {
  await testDatabase.destroy();
});

const resource = { type: 'database.collection', id: 'orders' } as const;

/**
 * The plugin with the collections these tests grant on in the permission
 * model. `invoices` is registered and absent from db, which is a different
 * denial from one nobody registered.
 */
function databasePlugin(): ReturnType<typeof createDatabasePlugin> {
  return databaseTestPlugin('orders', 'invoices');
}

const ast = (root: object): object => ({
  kind: 'filter',
  version: 1,
  collection: 'orders',
  root,
});

const and = (items: readonly object[]): object => ({
  kind: 'group',
  logic: 'and',
  items,
});

function readerStore(policy: object): MockPermissionSetStore {
  return new MockPermissionSetStore({
    permissionSets: [
      {
        key: 'order-reader',
        grants: [{ resource, actions: [{ action: 'read', policy }] }],
      },
    ],
    assignments: [
      {
        id: 'reader-assignment',
        subject: { type: 'user', id: 'alice' },
        permissionSet: 'order-reader',
      },
    ],
  });
}

function setup(
  policy: object = {
    type: 'database',
    fields: ['id', 'amount', 'ownerId'],
    recordAccess: ['recordsIOwn'],
  },
) {
  return createAuthorization({
    connection,
    plugins: [
      permissionSetsPlugin({ store: readerStore(policy) }),
      databasePlugin(),
    ],
  });
}

const request = {
  principal: { type: 'user', id: 'alice' },
  resource,
  action: 'read',
  params: { fields: { output: ['id', 'amount'] } },
};

describe('database resource authorization', () => {
  it('rejects object-shaped grant fields even without requested fields', async () => {
    const authorization = setup({
      type: 'database',
      fields: { input: ['id'] },
      recordAccess: ['allRecords'],
    });
    await expect(
      authorizeAs(authorization, { ...request, params: {} }),
    ).resolves.toMatchObject({
      effect: 'deny',
      reasons: [{ code: 'NO_OBJECT_PERMISSION' }],
    });
  });

  it('denies every Collection when the plugin was installed without a connection', async () => {
    const authorization = createAuthorization({
      plugins: [
        permissionSetsPlugin({ store: readerStore({ type: 'database' }) }),
        databasePlugin(),
      ],
    });

    await expect(authorizeAs(authorization, request)).resolves.toMatchObject({
      effect: 'deny',
      reasons: [{ code: 'DATABASE_UNAVAILABLE' }],
    });
  });

  it('denies a Collection db does not hold', async () => {
    await expect(
      authorizeAs(setup(), {
        ...request,
        resource: { type: 'database.collection', id: 'invoices' },
      }),
    ).resolves.toMatchObject({
      effect: 'deny',
      reasons: [{ code: 'UNKNOWN_DATABASE_RESOURCE_OR_ACTION' }],
    });
  });

  it('returns a conditional scope and field list for collection operations', async () => {
    const authorization = setup();
    await expect(authorizeAs(authorization, request)).resolves.toMatchObject({
      effect: 'conditional',
      conditions: {
        type: 'database',
        collection: 'orders',
        action: 'read',
        scope: ast(and([condition('ownerId', '$eq', 'alice')])),
        fields: ['id', 'amount', 'ownerId'],
      },
    });
    await expect(canAs(authorization, request)).resolves.toBe(false);
    await expect(
      authorizeAs(authorization, {
        ...request,
        params: { fields: { output: ['missing'] } },
      }),
    ).resolves.toMatchObject({
      effect: 'deny',
      reasons: [{ code: 'UNKNOWN_DATABASE_FIELD' }],
    });
  });

  it('expands a wildcard grant to the registered field list', async () => {
    const authorization = setup({
      type: 'database',
      fields: '*',
      recordAccess: ['allRecords'],
    });
    await expect(
      authorizeAs(authorization, { ...request, params: {} }),
    ).resolves.toMatchObject({
      conditions: {
        scope: true,
        fields: orderFields,
        allFields: true,
        fieldAccess: { input: [], output: '*' },
      },
    });
  });

  it('returns input field constraints and an unrestricted scope for create, without a generated primary key', async () => {
    const creator = (fields: string[] | '*') =>
      createAuthorization({
        connection,
        plugins: [
          permissionSetsPlugin({
            store: new MockPermissionSetStore({
              permissionSets: [
                {
                  key: 'order-creator',
                  grants: [
                    {
                      resource,
                      actions: [
                        {
                          action: 'create',
                          policy: { type: 'database', fields },
                        },
                      ],
                    },
                  ],
                },
              ],
              assignments: [
                {
                  id: 'creator-assignment',
                  subject: { type: 'user', id: 'alice' },
                  permissionSet: 'order-creator',
                },
              ],
            }),
          }),
          databasePlugin(),
        ],
      });

    await expect(
      authorizeAs(creator(['amount', 'ownerId']), {
        ...request,
        action: 'create',
        params: { fields: { input: ['amount'] } },
      }),
    ).resolves.toMatchObject({
      effect: 'conditional',
      conditions: {
        action: 'create',
        scope: true,
        fields: ['amount', 'ownerId'],
      },
    });
    await expect(
      authorizeAs(creator('*'), { ...request, action: 'create', params: {} }),
    ).resolves.toMatchObject({
      conditions: {
        action: 'create',
        scope: true,
        fields: orderFields.filter((field) => field !== 'id'),
      },
    });
  });

  it('takes the field a Record Access policy compares from its params', async () => {
    const authorization = setup({
      type: 'database',
      fields: ['id'],
      recordAccess: [{ key: 'recordsICreated', params: { field: 'ownerId' } }],
    });

    await expect(
      authorizeAs(authorization, {
        ...request,
        params: { fields: { output: ['id'] } },
      }),
    ).resolves.toMatchObject({
      conditions: { scope: ast(and([condition('ownerId', '$eq', 'alice')])) },
    });
  });

  it('denies a Record Access policy pointed at a field the Collection has not, or returning an invalid scope', async () => {
    const pointed = setup({
      type: 'database',
      fields: ['id'],
      recordAccess: [{ key: 'recordsIOwn', params: { field: 'missing' } }],
    });
    const invalid = setup({
      type: 'database',
      fields: ['id'],
      recordAccess: ['invalidFilter'],
    });
    invalid.recordAccess.define({
      key: 'invalidFilter',
      collections: ['orders'],
      resolve: () => condition('unknownField', '$eq', 'value'),
    });

    for (const [authorization, field] of [
      [pointed, 'missing'],
      [invalid, 'unknownField'],
    ] as const)
      await expect(
        authorizeAs(authorization, {
          ...request,
          params: { fields: { output: ['id'] } },
        }),
      ).resolves.toMatchObject({
        effect: 'deny',
        reasons: [
          {
            code: 'DATABASE_AUTHORIZATION_FAILED',
            message: `Unknown Record Access scope field: ${field}`,
          },
        ],
      });
  });

  it.each([
    [
      'a FilterAst',
      {
        kind: 'filter',
        version: 1,
        root: {
          kind: 'group',
          logic: 'and',
          items: [condition('id', '$eq', 'one')],
        },
      },
      'conditional',
    ],
    [
      'an unsupported version',
      {
        kind: 'filter',
        version: 2,
        root: { kind: 'group', logic: 'and', items: [] },
      },
      'deny',
    ],
    ['a bare root', { kind: 'filter', version: 1, root: true }, 'deny'],
    [
      'another collection',
      {
        kind: 'filter',
        version: 1,
        collection: 'other',
        root: { kind: 'group', logic: 'and', items: [] },
      },
      'deny',
    ],
    ['a foreign shape', { prefix: 'files/' }, 'deny'],
  ] as const)(
    'answers a Record Access result of %s with the expected effect',
    async (_name, value, effect) => {
      const authorization = setup({
        type: 'database',
        fields: ['id'],
        recordAccess: ['ast'],
      });
      authorization.recordAccess.define(
        defineRecordAccess('ast', (access) =>
          access.collections('orders').resolver(() => value),
        ),
      );
      const decision = await authorizeAs(authorization, {
        principal: { type: 'user', id: 'alice' },
        resource,
        action: 'read',
      });
      expect(decision.effect).toBe(effect);
    },
  );

  it('denies a Record Access policy that applies to another collection', async () => {
    const authorization = setup({
      type: 'database',
      recordAccess: ['foreign'],
    });
    authorization.recordAccess.define(
      defineRecordAccess('foreign', (access) =>
        access.collections('files').resolver(() => true),
      ),
    );
    expect(
      (
        await authorizeAs(authorization, {
          principal: { type: 'user', id: 'alice' },
          resource,
          action: 'read',
        })
      ).effect,
    ).toBe('deny');
  });

  it.each(['recordsIOwn', 'recordsICreated'])(
    'denies %s for a non-user principal with USER_CONTEXT_REQUIRED',
    async (key) => {
      const authorization = createAuthorization({
        connection,
        plugins: [
          permissionSetsPlugin({
            store: new MockPermissionSetStore({
              permissionSets: [
                {
                  key: 'department-reader',
                  grants: [
                    {
                      resource,
                      actions: [
                        {
                          action: 'read',
                          policy: {
                            type: 'database',
                            fields: ['id'],
                            recordAccess: [key],
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
              assignments: [
                {
                  id: 'department-assignment',
                  subject: { type: 'department', id: 'sales' },
                  permissionSet: 'department-reader',
                },
              ],
            }),
          }),
          databasePlugin(),
        ],
      });
      await expect(
        authorizeAs(authorization, {
          ...request,
          principal: { type: 'department', id: 'sales' },
          params: { fields: { output: ['id'] } },
        }),
      ).resolves.toMatchObject({
        effect: 'deny',
        reasons: expect.arrayContaining([
          expect.objectContaining({ code: 'USER_CONTEXT_REQUIRED' }),
        ]),
      });
    },
  );

  it('registers an application-defined Record Access policy', async () => {
    const regionalRecords = defineRecordAccess('regionalRecords', (access) =>
      access
        .collections('orders')
        .params<{ field: string }>({})
        .resolver(({ principal, params }) =>
          condition(
            params.field,
            '$eq',
            String(principal.attributes?.regionId),
          ),
        ),
    );
    const authorization = setup({
      type: 'database',
      fields: ['id', 'regionId'],
      recordAccess: [{ key: 'regionalRecords', params: { field: 'regionId' } }],
    });
    authorization.recordAccess.define(regionalRecords);

    await expect(
      authorizeAs(authorization, {
        principal: {
          type: 'user',
          id: 'alice',
          attributes: { regionId: 'north' },
        },
        resource,
        action: 'read',
        params: { fields: { output: ['id', 'regionId'] } },
      }),
    ).resolves.toMatchObject({
      effect: 'conditional',
      conditions: {
        scope: ast(and([condition('regionId', '$eq', 'north')])),
      },
    });
  });

  it('resolves a custom filter Record Access policy from grant params', async () => {
    const authorization = setup({
      type: 'database',
      fields: ['id', 'regionId'],
      recordAccess: [
        {
          key: 'customFilter',
          params: { filter: condition('regionId', '$eq', 'east') },
        },
      ],
    });
    await expect(
      authorizeAs(authorization, {
        ...request,
        params: { fields: { output: ['id', 'regionId'] } },
      }),
    ).resolves.toMatchObject({
      conditions: { scope: ast(and([condition('regionId', '$eq', 'east')])) },
    });
  });

  it('ors positive scopes together and ands every restriction', async () => {
    const rules = new MockSharingRuleStore([
      {
        key: 'shared-order',
        resource,
        actions: [
          {
            action: 'read',
            selection: { type: 'records', ids: ['order-1', 'order-2'] },
          },
        ],
        subjects: [{ type: 'user', id: 'alice' }],
      },
    ]);
    const restrictions = new MockRestrictionRuleStore([
      {
        key: 'owned-only',
        resource,
        actions: [
          {
            action: 'read',
            selection: { type: 'recordAccess', key: 'recordsIOwn' },
          },
        ],
        subjects: [{ type: 'user', id: 'alice' }],
      },
    ]);
    const authorization = createAuthorization({
      connection,
      plugins: [
        permissionSetsPlugin({
          store: readerStore({
            type: 'database',
            fields: ['id', 'ownerId'],
          }),
        }),
        sharingRulesPlugin({ store: rules }),
        restrictionRulesPlugin({ store: restrictions }),
        databasePlugin(),
      ],
    });

    await expect(
      authorizeAs(authorization, {
        ...request,
        params: { fields: { output: ['id', 'ownerId'] } },
      }),
    ).resolves.toMatchObject({
      effect: 'conditional',
      conditions: {
        scope: ast(
          and([
            {
              kind: 'group',
              logic: 'or',
              items: [
                condition('id', '$eq', 'order-1'),
                condition('id', '$eq', 'order-2'),
              ],
            },
            condition('ownerId', '$eq', 'alice'),
          ]),
        ),
      },
    });
  });

  it('denies when no positive scope allows any row', async () => {
    const authorization = setup({
      type: 'database',
      fields: ['id'],
    });
    await expect(
      authorizeAs(authorization, {
        ...request,
        params: { fields: { output: ['id'] } },
      }),
    ).resolves.toMatchObject({
      effect: 'deny',
      reasons: expect.arrayContaining([
        {
          code: 'NO_RECORD_ACCESS',
          message: 'No Record Access allows this action',
          plugin: 'database',
        },
      ]),
    });
  });

  it('answers a configured scope that selects nothing with a scope matching no rows', async () => {
    const authorization = setup({
      type: 'database',
      fields: ['id'],
      recordAccess: ['nobody'],
    });
    authorization.recordAccess.define(
      defineRecordAccess('nobody', (access) =>
        access.collections('orders').resolver(() => false),
      ),
    );
    await expect(
      authorizeAs(authorization, {
        ...request,
        params: { fields: { output: ['id'] } },
      }),
    ).resolves.toMatchObject({
      effect: 'conditional',
      conditions: {
        scope: ast(
          and([condition('id', '$empty'), condition('id', '$notEmpty')]),
        ),
      },
      reasons: expect.arrayContaining([
        expect.objectContaining({ code: 'EMPTY_RECORD_ACCESS' }),
      ]),
    });
  });

  it('lets a generic default access scope open a grant with no Record Access', async () => {
    const defaults = new MockDefaultAccessStore([
      { resource, actions: [{ action: 'read', selection: { type: 'all' } }] },
    ]);
    const authorization = createAuthorization({
      connection,
      plugins: [
        permissionSetsPlugin({
          store: readerStore({ type: 'database', fields: ['id'] }),
        }),
        defaultAccessPlugin({ store: defaults }),
        databasePlugin(),
      ],
    });

    await expect(
      authorizeAs(authorization, {
        ...request,
        params: { fields: { output: ['id'] } },
      }),
    ).resolves.toMatchObject({
      effect: 'conditional',
      conditions: { scope: true },
    });
  });

  it('denies an unknown collection, action or field for an unrestricted identity', async () => {
    const store = new MockPermissionSetStore({
      permissionSets: [{ key: 'superuser', grants: [] }],
      assignments: [
        {
          id: 'root-superuser',
          subject: { type: 'user', id: 'root' },
          permissionSet: 'superuser',
        },
      ],
    });
    const authorization = createAuthorization({
      connection,
      plugins: [permissionSetsPlugin({ store }), databasePlugin()],
    });
    authorization.permissionSets.protect({
      owner: '@nocobase/test',
      keys: ['superuser'],
      unrestricted: true,
    });
    const principal = { type: 'user', id: 'root' } as const;

    await expect(
      authorizeAs(authorization, {
        principal,
        resource: { type: 'database.collection', id: 'invoices' },
        action: 'read',
      }),
    ).resolves.toMatchObject({
      reasons: [{ code: 'UNKNOWN_DATABASE_RESOURCE_OR_ACTION' }],
    });
    await expect(
      authorizeAs(authorization, { principal, resource, action: 'archive' }),
    ).resolves.toMatchObject({
      reasons: [{ code: 'RESOURCE_ACTION_NOT_SUPPORTED' }],
    });
    await expect(
      authorizeAs(authorization, {
        principal,
        resource,
        action: 'read',
        params: { fields: { output: ['secret'] } },
      }),
    ).resolves.toMatchObject({
      reasons: [{ code: 'UNKNOWN_DATABASE_FIELD' }],
    });
    await expect(
      authorizeAs(authorization, { principal, resource, action: 'read' }),
    ).resolves.toEqual({
      effect: 'conditional',
      conditions: {
        type: 'database',
        collection: 'orders',
        action: 'read',
        scope: true,
        fields: orderFields,
        fieldAccess: { input: '*', output: '*' },
        allFields: true,
      },
      reasons: [
        {
          code: 'UNRESTRICTED_ACCESS',
          message: 'Unrestricted access allows orders.read',
          plugin: 'database',
        },
      ],
    });
  });
});
