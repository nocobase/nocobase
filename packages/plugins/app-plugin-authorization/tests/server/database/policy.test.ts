import {
  defineCompositeResource,
  defineRecordAccess,
} from '@nocobase/authorization/core';
import { permissionSetsPlugin } from '@nocobase/authorization';
import {
  databaseManagerToken,
  type DatabaseConnection,
  type DatabaseManager,
} from '@nocobase/db';
import { type TestDatabase } from '@nocobase/app-testing/server';
import { defineRepositoryApiRoutes } from '@nocobase/app-server/router';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import permissionSetMigration from '../../../database/migrations/202608210001_create_permission_set_tables.js';
import { createAppAuthorization } from '../../../server/authorization.js';
import { databasePlugin as createDatabasePlugin } from '../../../server/database/plugin.js';
import { condition } from '../../../server/database/scope.js';
import { defineDatabasePermission } from '../../../server/index.js';
import {
  authorizeAs,
  createAuthorization,
  databaseTestPlugin,
} from '../../helpers/authorization-fixture.js';
import { migrationContext } from '../../helpers/database-fixture.js';
import { MockPermissionSetStore } from '../../helpers/mock-permission-set-store.js';
import {
  createOrdersDatabase,
  orderFields,
} from '../../helpers/orders-database.js';

let testDatabase: TestDatabase;
let database: DatabaseManager;
let connection: DatabaseConnection;
let signedInAs = 'alice';

/** `orders` for the policy folds, `authzOrders` and `authzCustomers` for relations. */
beforeEach(async () => {
  testDatabase = await createOrdersDatabase();
  database = testDatabase.database;
  connection = database.connection();
  await permissionSetMigration.up(migrationContext(connection));
  await connection.builder.createCollections([
    {
      name: 'authzCustomers',
      definition: (customers) => {
        customers.string('id', { length: 64 }).primary().notNull();
        customers.string('name', { length: 120 }).notNull();
      },
    },
    {
      name: 'authzOrders',
      definition: (orders) => {
        orders.string('id', { length: 64 }).primary().notNull();
        orders.string('ownerId', { length: 64 }).notNull();
        orders.integer('amount');
        orders.string('customerId', { length: 64 });
        orders
          .belongsTo('customer', 'authzCustomers')
          .targetKey('id')
          .foreignKey('customerId')
          .constraints(false);
      },
    },
  ]);
  await connection.repository('authzCustomers').createOne({
    values: { id: 'acme', name: 'Acme' },
  });
  for (const row of [
    { id: 'order-1', ownerId: 'alice', amount: 10 },
    { id: 'order-2', ownerId: 'bob', amount: 20 },
  ]) {
    await connection.repository('authzOrders').createOne({ values: row });
  }
  signedInAs = 'alice';
});

afterEach(async () => {
  await testDatabase.destroy();
});

const resource = { type: 'database.collection', id: 'orders' } as const;

/** `invoices` is registered and absent from db. */
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

describe('policyFor', () => {
  it('folds a request’s decisions into a Repository Policy', async () => {
    const store = new MockPermissionSetStore({
      permissionSets: [
        {
          key: 'order-editor',
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
                {
                  action: 'create',
                  policy: {
                    type: 'database',
                    fields: ['amount'],
                  },
                },
                {
                  action: 'update',
                  policy: {
                    type: 'database',
                    fields: ['amount'],
                    recordAccess: ['recordsIOwn'],
                  },
                },
              ],
            },
          ],
        },
      ],
      assignments: [
        {
          id: 'editor-assignment',
          subject: { type: 'user', id: 'alice' },
          permissionSet: 'order-editor',
        },
      ],
    });
    const authorization = createAuthorization({
      connection,
      plugins: [permissionSetsPlugin({ store }), databasePlugin()],
    });
    const scope = authorization.for({
      principal: { type: 'user', id: 'alice' },
    });

    await expect(
      authorization.database.policyFor('orders', scope),
    ).resolves.toEqual({
      read: { scope: true, fields: orderFields, relations: {} },
      create: { scope: true, fields: ['amount'], relations: {} },
      update: {
        scope: ast(and([condition('ownerId', '$eq', 'alice')])),
        fields: ['amount'],
        relations: {},
      },
      // The grant says nothing about deleting, so the action is denied.
      delete: false,
    });
    await expect(
      authorization.database.policyFor(
        'orders',
        authorization.for({ principal: { type: 'user', id: 'bob' } }),
      ),
    ).resolves.toEqual({
      read: false,
      create: false,
      update: false,
      delete: false,
    });
  });

  it('folds every action to true for an unrestricted identity', async () => {
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

    await expect(
      authorization.database.policyFor(
        'orders',
        authorization.for({ principal: { type: 'user', id: 'root' } }),
      ),
    ).resolves.toEqual({
      read: true,
      create: true,
      update: true,
      delete: true,
    });
  });
});

describe('a data scope that reaches no records', () => {
  function setup() {
    const policy = (action: string) => ({
      action,
      policy: {
        type: 'database',
        fields: action === 'update' ? ['ownerId', 'amount'] : '*',
        recordAccess: ['noRecords'],
      },
    });
    const store = new MockPermissionSetStore({
      permissionSets: [
        {
          key: 'scoped-editor',
          grants: [
            {
              resource,
              actions: [
                policy('read'),
                policy('update'),
                policy('delete'),
                {
                  action: 'create',
                  policy: { type: 'database', fields: ['ownerId', 'amount'] },
                },
              ],
            },
          ],
        },
      ],
      assignments: [
        {
          id: 'scoped-assignment',
          subject: { type: 'user', id: 'alice' },
          permissionSet: 'scoped-editor',
        },
      ],
    });
    const authorization = createAuthorization({
      connection,
      plugins: [permissionSetsPlugin({ store }), databasePlugin()],
    });
    // Such as a user in no department: the scope is configured and selects nothing.
    authorization.recordAccess.define(
      defineRecordAccess('noRecords', (access) =>
        access.collections('orders').resolver(() => false),
      ),
    );
    return authorization;
  }

  it('reads, updates and deletes nothing instead of refusing', async () => {
    const authorization = setup();
    const orders = database.repository('orders');
    await orders.createOne({ values: { ownerId: 'alice', amount: 10 } });
    const policy = await authorization.database.policyFor(
      'orders',
      authorization.for({ principal: { type: 'user', id: 'alice' } }),
    );
    expect(policy.read).not.toBe(false);
    expect(policy.update).not.toBe(false);
    expect(policy.delete).not.toBe(false);

    const scoped = orders.withPolicy(policy);
    await expect(scoped.findMany()).resolves.toEqual([]);
    await expect(scoped.count()).resolves.toBe(0);
    await expect(
      scoped.updateMany({
        filter: { ownerId: 'alice' },
        values: { amount: 20 },
      }),
    ).resolves.toMatchObject({ updatedCount: 0 });
    await expect(
      scoped.deleteMany({ filter: { ownerId: 'alice' } }),
    ).resolves.toMatchObject({
      deletedCount: 0,
    });
    // Create reads no record scope, so the grant alone allows it.
    await scoped.createOne({ values: { ownerId: 'alice', amount: 30 } });
    await expect(orders.count()).resolves.toBe(2);
  });

  it('keeps a principal without a grant denied', async () => {
    const authorization = setup();
    await expect(
      authorization.database.policyFor(
        'orders',
        authorization.for({ principal: { type: 'user', id: 'bob' } }),
      ),
    ).resolves.toEqual({
      read: false,
      create: false,
      update: false,
      delete: false,
    });
  });
});

describe('the Collection registry', () => {
  it('records registrations in order and needs a name', () => {
    const { collections } = createAuthorization({
      plugins: [
        permissionSetsPlugin({ store: new MockPermissionSetStore() }),
        createDatabasePlugin(),
      ],
    }).database;
    collections.add({ name: 'orders', title: 'Orders' });
    collections.add({
      name: 'invoices',
      title: 'Invoices',
      description: 'Billing documents',
    });

    expect(collections.has('orders')).toBe(true);
    expect(collections.has('shipments')).toBe(false);
    expect(collections.list()).toEqual([
      { name: 'orders', title: 'Orders' },
      {
        name: 'invoices',
        title: 'Invoices',
        description: 'Billing documents',
      },
    ]);
    expect(() => collections.add({ name: '', title: 'x' })).toThrow(
      /needs a name/,
    );
  });

  // Boot runs more than once in some hosts, and two modules may register one
  // collection under different titles; only a conflict about what it allows
  // is a mistake.
  it('treats a repeat as a no-op, keeps the first title of a display-only repeat, and refuses different actions', () => {
    const { collections } = createAuthorization({
      plugins: [
        permissionSetsPlugin({ store: new MockPermissionSetStore() }),
        createDatabasePlugin(),
      ],
    }).database;
    collections.add({ name: 'orders', title: 'Orders' });
    collections.add({ name: 'orders', title: 'Orders' });
    expect(collections.warnings()).toEqual([]);

    collections.add({ name: 'orders', title: { key: 'orders', ns: 'sales' } });
    expect(collections.list()).toEqual([{ name: 'orders', title: 'Orders' }]);
    expect(collections.warnings()).toEqual([
      'Database collection orders was registered again with a different title or description; the first registration is kept',
    ]);

    expect(() =>
      collections.add({ name: 'orders', title: 'Orders', actions: ['read'] }),
    ).toThrow(
      'Database collection orders is already registered with actions [read, create, update, delete]; another registration declares [read]',
    );
  });

  // `orders` is in db and a Permission Set grants on it; registration is what
  // is missing, and that alone is enough to deny.
  it('grants nothing on a Collection outside the permission model, even to an unrestricted identity', async () => {
    const store = new MockPermissionSetStore({
      permissionSets: [
        {
          key: 'order-reader',
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
        { key: 'superuser', grants: [] },
      ],
      assignments: [
        {
          id: 'reader-assignment',
          subject: { type: 'user', id: 'alice' },
          permissionSet: 'order-reader',
        },
        {
          id: 'root-superuser',
          subject: { type: 'user', id: 'root' },
          permissionSet: 'superuser',
        },
      ],
    });
    const authorization = createAuthorization({
      connection,
      plugins: [permissionSetsPlugin({ store }), createDatabasePlugin()],
    });
    authorization.permissionSets.protect({
      owner: '@nocobase/test',
      keys: ['superuser'],
      unrestricted: true,
    });

    for (const id of ['alice', 'root']) {
      const principal = { type: 'user', id };
      await expect(
        authorizeAs(authorization, { principal, resource, action: 'read' }),
      ).resolves.toMatchObject({
        effect: 'deny',
        reasons: [{ code: 'RESOURCE_ACTION_NOT_SUPPORTED' }],
      });
      await expect(
        authorization.database.policyFor(
          'orders',
          authorization.for({ principal }),
        ),
      ).resolves.toEqual({
        read: false,
        create: false,
        update: false,
        delete: false,
      });
    }
  });
});

describe('collection policy enforcement', () => {
  it('does not move a relation capability from an owned-record grant onto all records', async () => {
    const authorization = appAuthorization();
    authorization.database.collections.add({
      name: 'authzOrders',
      title: 'Orders',
    });
    await createSet('own-connection', [
      {
        resource: { type: 'database.collection', id: 'authzOrders' },
        actions: [
          {
            action: 'update',
            policy: {
              type: 'database',
              fields: [],
              recordAccess: ['recordsIOwn'],
              relations: { customer: { connect: {} } },
            },
          },
        ],
      },
    ]);
    await createSet('all-amounts', [
      {
        resource: { type: 'database.collection', id: 'authzOrders' },
        actions: [
          {
            action: 'read',
            policy: {
              type: 'database',
              fields: ['id'],
              recordAccess: ['allRecords'],
            },
          },
          {
            action: 'update',
            policy: {
              type: 'database',
              fields: ['amount'],
              recordAccess: ['allRecords'],
            },
          },
        ],
      },
    ]);
    await assign('own-connection', 'alice');
    await assign('all-amounts', 'alice');
    const policy = await authorization.database.policyFor(
      'authzOrders',
      authorization.for({ principal: { type: 'user', id: 'alice' } }),
    );
    const repository = database.repository('authzOrders').withPolicy(policy);
    await expect(
      repository.updateOne({
        filter: { id: 'order-2' },
        values: { customer: { connect: { id: 'acme' } } },
      }),
    ).rejects.toMatchObject({ code: 'RECORD_NOT_FOUND' });
    await repository.updateOne({
      filter: { id: 'order-1' },
      values: { customer: { connect: { id: 'acme' } } },
    });
    expect(
      await database
        .repository('authzOrders')
        .findOne({ filter: { id: 'order-2' } }),
    ).toMatchObject({ customerId: null });
  });

  it('does not combine broad field access with narrow field access into broad edits', async () => {
    const authorization = appAuthorization();
    authorization.database.collections.add({
      name: 'authzOrders',
      title: 'Orders',
    });
    const update = (fields: string[], recordAccess: string[]) => ({
      resource: { type: 'database.collection', id: 'authzOrders' },
      actions: [
        {
          action: 'update',
          policy: { type: 'database', fields, recordAccess },
        },
      ],
    });
    await createSet('all-amounts', [
      {
        resource: { type: 'database.collection', id: 'authzOrders' },
        actions: [
          {
            action: 'read',
            policy: {
              type: 'database',
              fields: ['id'],
              recordAccess: ['allRecords'],
            },
          },
        ],
      },
      update(['amount'], ['allRecords']),
    ]);
    await createSet('own-customers', [update(['customerId'], ['recordsIOwn'])]);
    await assign('all-amounts', 'alice');
    await assign('own-customers', 'alice');
    const repository = database
      .repository('authzOrders')
      .withPolicy(
        await authorization.database.policyFor(
          'authzOrders',
          authorization.for({ principal: { type: 'user', id: 'alice' } }),
        ),
      );

    await expect(
      repository.updateOne({
        filter: { id: 'order-2' },
        values: { customerId: 'acme' },
      }),
    ).rejects.toMatchObject({ code: 'RECORD_NOT_FOUND' });
    await repository.updateOne({
      filter: { id: 'order-1' },
      values: { customerId: 'acme' },
    });
  });
});

function appAuthorization(): ReturnType<typeof createAppAuthorization> {
  return createAppAuthorization({ connection: database.connection() });
}

function post(
  router: Hono,
  path: string,
  body: object = {},
): Promise<Response> {
  return router.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** The grant `DatabaseAuthorizationService.grant()` produces, stored as a set. */
async function grantOrders(config: object): Promise<void> {
  await createSet('order-reader', [
    {
      resource: { type: 'database.collection', id: 'authzOrders' },
      actions: ['read', 'create', 'update', 'delete'].map((action) => ({
        action,
        policy: {
          type: 'database',
          fields: '*',
          ...config,
        },
      })),
    },
  ]);
  await assign('order-reader', signedInAs);
}

async function createSet(
  key: string,
  grants: readonly object[],
): Promise<void> {
  const now = new Date();
  await database
    .connection()
    .query.insertInto('authorizationPermissionSets')
    .values({
      id: crypto.randomUUID(),
      key,
      title: JSON.stringify(key),
      grants: JSON.stringify(grants),
      createdAt: now,
      updatedAt: now,
    })
    .execute();
}

async function assign(key: string, userId: string): Promise<void> {
  const now = new Date();
  await database
    .connection()
    .query.insertInto('authorizationPermissionSetAssignments')
    .values({
      id: `user:${userId}:${key}`,
      subjectType: 'user',
      subjectId: userId,
      permissionSetKey: key,
      createdAt: now,
      updatedAt: now,
    })
    .execute();
}

const quoteAccess = defineDatabasePermission((permission) =>
  permission.collection('authzOrders').read(['id', 'ownerId', 'amount']),
);
const compositeOrders = defineCompositeResource('sales.orders', (resource) =>
  resource
    .title('Orders')
    .action('view', (action) => action.grant('orders', quoteAccess))
    .action('edit', (action) =>
      action.grant('orders', quoteAccess.update(['amount'])),
    ),
);

async function compositeRoutes(
  options: { collection?: string; authorize?: boolean } = {},
) {
  const authorization = appAuthorization();
  authorization.database.collections.add({
    name: 'authzOrders',
    title: 'Orders',
  });
  authorization.compositeResources.define(compositeOrders);
  const container = new ServiceContainer();
  container.instance(databaseManagerToken, database);
  const router = new Hono();
  router.use('*', async (c, next) => {
    c.set('auth', { user: { id: signedInAs } });
    await next();
  });

  if (options.authorize !== false)
    router.use(
      '*',
      authorization.database.authorizeRepository({
        repository: 'salesOrders',
        resource: compositeOrders.reference(),
        actions: { findMany: 'view', count: 'view', updateOne: 'edit' },
      }),
    );
  router.route(
    '/',
    await defineRepositoryApiRoutes({
      repositories: [
        {
          name: 'salesOrders',
          collection: options.collection ?? 'authzOrders',
          policy: { read: true, update: true, create: false, delete: true },
          actions: { findMany: {}, count: {}, updateOne: {}, deleteOne: {} },
        },
      ],
    }).createRouter({ container }),
  );
  return router;
}

async function grantBusinessOrders() {
  await createSet('business', [
    compositeOrders.reference().grant({
      view: { orders: 'allRecords' },
      edit: { orders: 'recordsIOwn' },
    }),
  ]);
  await assign('business', signedInAs);
}

describe('business operation Repository middleware', () => {
  it('does not accept collection grants in place of the bound business action', async () => {
    await grantOrders({ recordAccess: ['allRecords'] });
    expect(
      (await post(await compositeRoutes(), '/salesOrders:findMany')).status,
    ).toBe(403);
  });

  it('uses the exact operation scope and fields even with broad collection grants', async () => {
    await grantBusinessOrders();
    await grantOrders({ recordAccess: ['allRecords'] });
    const router = await compositeRoutes();
    const rows = await post(router, '/salesOrders:findMany');
    expect(rows.status).toBe(200);
    expect((await rows.json()).data).toHaveLength(2);
    expect((await post(router, '/salesOrders:count')).status).toBe(200);
    expect(
      (
        await post(router, '/salesOrders:updateOne', {
          filter: { id: 'order-1' },
          values: { amount: 15 },
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await post(router, '/salesOrders:updateOne', {
          filter: { id: 'order-2' },
          values: { amount: 15 },
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await post(router, '/salesOrders:updateOne', {
          filter: { id: 'order-1' },
          values: { ownerId: 'bob' },
        })
      ).status,
    ).toBe(403);
    signedInAs = 'bob';
    expect((await post(router, '/salesOrders:findMany')).status).toBe(403);
  });

  it('denies unmapped methods and mismatched target collections', async () => {
    await grantBusinessOrders();
    expect(
      (
        await post(await compositeRoutes(), '/salesOrders:deleteOne', {
          filter: { id: 'order-1' },
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await post(
          await compositeRoutes({ collection: 'authzCustomers' }),
          '/salesOrders:findMany',
        )
      ).status,
    ).toBe(403);
  });

  it('rejects multi-scope operations, including two scopes of the same collection', () => {
    const authorization = appAuthorization();
    for (const target of ['authzOrders', 'authzCustomers']) {
      const complex = defineCompositeResource(`complex.${target}`, (resource) =>
        resource.action('submit', (action) =>
          action.grant('orders', quoteAccess.update(['amount'])).grant(
            'parent',
            defineDatabasePermission((p) => p.collection(target).read(['id'])),
          ),
        ),
      );
      authorization.compositeResources.define(complex);
      expect(() =>
        authorization.database.authorizeRepository({
          repository: 'orders',
          resource: complex.reference(),
          actions: { updateOne: 'submit' },
        }),
      ).toThrow('single-scope');
    }
  });

  it('rejects an unknown action or a binding without the required database operation', () => {
    const authorization = appAuthorization();
    authorization.compositeResources.define(compositeOrders);
    expect(() =>
      authorization.database.authorizeRepository({
        repository: 'orders',
        resource: compositeOrders.reference(),
        actions: { updateOne: 'view' },
      }),
    ).toThrow('matching database operation');
  });
});

describe('relation policies', () => {
  it.each([
    [
      'an unknown target field',
      'read',
      { customer: { fields: ['secret'] } },
      'Unknown permission field',
    ],
    [
      'an unknown relation',
      'update',
      { missing: { connect: {} } },
      'Unknown permission relation',
    ],
    [
      'a through payload on a to-one relation',
      'update',
      { customer: { connect: { through: { fields: ['note'] } } } },
      'many-to-many',
    ],
  ] as const)(
    'rejects a relation policy naming %s',
    async (_name, action, relations, message) => {
      const authorization = appAuthorization();
      authorization.database.collections.add({
        name: 'authzOrders',
        title: 'Orders',
      });
      await createSet('relations', [
        {
          resource: { type: 'database.collection', id: 'authzOrders' },
          actions: [
            {
              action,
              policy: {
                type: 'database',
                fields: ['id'],
                recordAccess: ['allRecords'],
                relations,
              },
            },
          ],
        },
      ]);
      await assign('relations', 'alice');
      const alice = authorization.for({
        principal: { type: 'user', id: 'alice' },
      });
      const policy = await authorization.database.policyFor(
        'authzOrders',
        alice,
      );
      expect(policy[action]).toBe(false);
      await expect(
        alice.authorize({
          resource: { type: 'database.collection', id: 'authzOrders' },
          action,
        }),
      ).resolves.toMatchObject({
        effect: 'deny',
        reasons: [
          {
            code: 'DATABASE_AUTHORIZATION_FAILED',
            message: expect.stringContaining(message),
          },
        ],
      });
    },
  );
});
