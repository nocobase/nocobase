import {
  createApiClient,
  ApiClientError,
  buildFindManyOptions,
  buildGroupByOptions,
} from '@nocobase/api-client';
import {
  databaseManagerToken,
  type DatabaseManager,
  buildRepositoryPolicy,
  ref,
  type RepositoryPolicy,
  RepositoryError,
  type RepositoryQuery,
} from '@nocobase/db';
import {
  provisionTestDatabases,
  withoutDecimalPadding,
  type ProvisionedTestDatabases,
  type TestDatabase,
} from '@nocobase/db-testing';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  addRepositoryRequestConstraint,
  apiErrorHandler,
  toApiError,
  defineRepositoryApiRoutes,
  type RepositoryApiActions,
  type DefineRepositoryApiRoutesOptions,
} from '../src/router/index.js';
import { defineServerPlugin } from '../src/plugins/index.js';

interface Order {
  id: string;
  status: string;
  version: number;
}

async function collect<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const values: T[] = [];
  for await (const value of iterable) values.push(value);
  return values;
}

const actions: RepositoryApiActions = {
  findMany: {},
  findOne: {},
  count: {},
  aggregate: {},
  groupBy: {},
  exists: {},
  createOne: {},
  updateOne: {},
  deleteOne: {},
};

/** Every action allowed. What a Policy restricts is what each test declares. */
const open: RepositoryPolicy = {
  read: true,
  create: true,
  update: true,
  delete: true,
};
/** The fields the shared `orders` exposures accept. */
const orderFields: RepositoryPolicy = {
  read: true,
  create: { scope: true, fields: ['id', 'status'] },
  update: { scope: true, fields: ['id', 'status'] },
  delete: true,
};

/**
 * Stand in for the Repository the routes run against.
 *
 * The routes bind a Policy, so they never use the instance the manager handed
 * back — `withPolicy` derives a new one. A test that replaces a method has to
 * replace it on the derived instance, which is what this returns.
 */
function stubScopedRepository(
  database: DatabaseManager,
  collection: string = 'orders',
): ReturnType<ReturnType<DatabaseManager['repository']>['withPolicy']> {
  const base = database.repository(collection);
  const scoped = base.withPolicy(open);
  vi.spyOn(base, 'withPolicy').mockReturnValue(scoped);
  vi.spyOn(database, 'repository').mockReturnValue(base);
  return scoped;
}

describe('Repository API routes', () => {
  let testDatabases: ProvisionedTestDatabases | undefined;
  let testDatabase: TestDatabase | undefined;
  let database: DatabaseManager;
  let container: ServiceContainer;
  let router: Hono;

  // One isolated database for the file; every test opens it emptied.
  beforeAll(async () => {
    testDatabases = await provisionTestDatabases();
  });

  afterAll(async () => {
    await testDatabases?.drop();
  });

  beforeEach(async () => {
    testDatabase = await testDatabases!.open();
    database = testDatabase.database;
    container = new ServiceContainer();
    container.instance(databaseManagerToken, database);
    await database.builder().createCollection('orders', (collection) => {
      collection.string('id').primary().notNull();
      collection.string('status').notNull();
      collection.integer('version').notNull();
      collection.optimisticLock('version');
    });
    const contribution = defineRepositoryApiRoutes({
      repositories: [
        {
          name: 'salesOrders',
          collection: 'orders',
          policy: orderFields,
          actions: { ...actions, findMany: { maxLimit: 2 } },
        },
        {
          name: 'catalog',
          collection: 'orders',
          policy: open,
          actions: { findOne: {} },
        },
      ],
    });
    router = new Hono();
    router.route('/api', await contribution.createRouter({ container }));
    router.get('/api/unrelated', (context) => context.json({ ok: true }));
  });

  afterEach(async () => {
    await testDatabase?.destroy();
    testDatabase = undefined;
  });

  it('intersects request constraints with static and principal policies without leaking between requests', async () => {
    await database
      .repository('orders')
      .createOne({ values: { id: 'one', status: 'draft' } });
    await database
      .repository('orders')
      .createOne({ values: { id: 'two', status: 'draft' } });
    const guarded = new Hono();
    guarded.use('*', async (c, next) => {
      if (c.req.header('x-constrained')) {
        addRepositoryRequestConstraint(c, {
          repository: 'orders',
          action: 'findMany',
          collection: 'orders',
          policy: {
            create: false,
            update: false,
            delete: false,
            read: { scope: { id: 'one' }, fields: ['id', 'status'] },
          },
        });
        addRepositoryRequestConstraint(c, {
          repository: 'orders',
          action: 'findMany',
          collection: 'orders',
          policy: {
            create: false,
            update: false,
            delete: false,
            read: { scope: true, fields: ['id'] },
          },
        });
      }
      await next();
    });
    guarded.route(
      '/',
      await defineRepositoryApiRoutes({
        principal: () => ({ user: 'alice' }),
        repositories: [
          {
            name: 'orders',
            policy: () => ({
              create: false,
              update: false,
              delete: false,
              read: { scope: true, fields: ['id', 'version'] },
            }),
            actions: { findMany: {} },
          },
        ],
      }).createRouter({ container }),
    );
    const request = (constrained: boolean) =>
      guarded.request('/orders/findMany', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(constrained ? { 'x-constrained': 'yes' } : {}),
        },
        body: '{}',
      });
    expect(await (await request(true)).json()).toEqual({
      data: [{ id: 'one' }],
    });
    expect((await (await request(false)).json()).data).toHaveLength(2);
  });

  it.each([
    { repository: 'other' },
    { action: 'count' as const },
    { collection: 'other' },
    { connection: 'other' },
  ])(
    'refuses a request constraint for a different target: %j',
    async (mismatch) => {
      const guarded = new Hono();
      guarded.use('*', async (c, next) => {
        addRepositoryRequestConstraint(c, {
          repository: 'catalog',
          action: 'findOne',
          collection: 'orders',
          policy: open,
          ...mismatch,
        });
        await next();
      });
      guarded.route('/', router);
      const response = await guarded.request('/api/catalog/findOne', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ filter: { id: 'one' } }),
      });
      expect(response.status).toBe(403);
    },
  );

  it('preserves precise numeric strings through HTTP filters, updates and errors', async () => {
    await database.builder().createCollection('balances', (c) => {
      c.string('id').primary();
      c.bigInt('amount');
      c.decimal('price', { precision: 20, scale: 6 });
    });
    const contribution = defineRepositoryApiRoutes({
      repositories: [
        {
          name: 'balances',
          collection: 'balances',
          policy: {
            read: true,
            create: { scope: true, fields: ['id', 'amount', 'price'] },
            update: { scope: true, fields: ['amount'] },
            delete: false,
          },
          actions: {
            findOne: {},
            createOne: {},
            updateOne: {},
          },
        },
      ],
    });
    router.route('/api', await contribution.createRouter({ container }));
    const balances = client().repository<{
      id: string;
      amount: string;
      price: string;
    }>('balances');
    await balances.createOne({
      values: { id: 'A', amount: '9007199254740993', price: '42.125000' },
    });
    expect(
      await balances.findOne({
        filter: (f) => f.number('amount').eq('9007199254740993'),
      }),
    ).toMatchObject({ id: 'A', amount: '9007199254740993' });
    expect(
      await balances.findOne({ filter: { price: '42.125' } }),
    ).toMatchObject({ id: 'A' });
    expect(
      await balances.updateOne({
        filter: { amount: '9007199254740993' },
        values: { amount: { increment: '2' } },
      }),
    ).toMatchObject({ record: { amount: '9007199254740995' } });
    const rejected = await router.request('/api/balances/updateOne', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        filter: { id: 'A' },
        values: { amount: Number.MAX_SAFE_INTEGER + 1 },
      }),
    });
    expect(rejected.status).toBe(400);
    expect(
      await database.repository('balances').findOne({ filter: { id: 'A' } }),
    ).toMatchObject({ amount: '9007199254740995' });
  });

  function client() {
    return createApiClient({
      baseURL: 'http://localhost/api',
      fetch: async (input, init) => router.fetch(new Request(input, init)),
    });
  }

  function request(action: string, input: unknown) {
    return router.request(`/api/salesOrders/${action}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
  }

  it('executes all remote actions with builders and accepts options helpers over raw HTTP', async () => {
    const api = client();
    const orders = api.repository<Order>('salesOrders');
    const created = await orders.createOne({
      values: (v) => ({ id: 'built', status: v.literal('paid') }),
      select: (s) => s.fields('id', 'status', 'version'),
    });
    expect(created.record).toMatchObject({ id: 'built', status: 'paid' });
    expect(
      await orders.findOne({
        filter: (f) => f.string('id').eq('built'),
        select: (s) => s.fields('id'),
      }),
    ).toEqual({ id: 'built' });
    expect(
      await orders.count({ filter: (f) => f.string('status').eq('paid') }),
    ).toBe(1);
    expect(
      await orders.exists({ filter: (f) => f.string('id').eq('built') }),
    ).toBe(true);
    const options = buildFindManyOptions<Order>({
      filter: (f) => f.string('status').eq('paid'),
      select: (s) => s.fields('id'),
      sort: (s) => s.field('id').asc(),
    });
    expect(
      await api.request({
        path: '/salesOrders/findMany',
        method: 'POST',
        json: options,
      }),
    ).toEqual({ data: [{ id: 'built' }] });
    expect(await collect(orders.findMany(options))).toEqual([{ id: 'built' }]);
    expect(
      await orders.aggregate({
        aggregate: (a) => ({ count: a.count(), total: a.sum('version') }),
      }),
    ).toEqual({ count: 1, total: '1' });
    const groups = buildGroupByOptions<Order>({
      by: ['status'],
      aggregate: (a) => ({ count: a.count() }),
      having: (f) => f.number('count').gte(1),
      sort: (s) => s.field('count').desc(),
    });
    expect(await orders.groupBy(groups)).toEqual([
      { status: 'paid', count: 1 },
    ]);
    expect(
      await orders.updateOne({
        filter: (f) => f.string('id').eq('built'),
        values: (v) => ({ status: v.literal('shipped') }),
        select: (s) => s.fields('status'),
        ifVersion: 1,
      }),
    ).toMatchObject({ record: { status: 'shipped' } });
    expect(
      await orders.deleteOne({
        filter: (f) => f.string('id').eq('built'),
        select: (s) => s.fields('id'),
        ifVersion: 2,
      }),
    ).toMatchObject({ deleted: true, record: { id: 'built' } });
  });

  it('keeps a relation Policy server-owned, exposure-wide and detached at declaration', async () => {
    await database.builder().createCollection('policyChildren', (c) => {
      c.string('id').primary();
      c.string('parentId').nullable();
      c.string('label');
    });
    await database.builder().createCollection('policyParents', (c) => {
      c.string('id').primary();
      c.hasMany('children', 'policyChildren')
        .sourceKey('id')
        .foreignKey('parentId');
    });
    const policy = {
      read: true as const,
      create: {
        scope: true as const,
        fields: ['id'],
        relations: { children: { create: { fields: ['id', 'label'] } } },
      },
      update: {
        scope: true as const,
        relations: { children: { update: { fields: ['label'] } } },
      },
      delete: false as const,
    };
    const contribution = defineRepositoryApiRoutes({
      repositories: [
        {
          name: 'policyParents',
          policy,
          actions: { createOne: {}, updateOne: {} },
        },
        {
          name: 'policyClosed',
          collection: 'policyParents',
          policy: { read: true, create: false, update: false, delete: false },
          actions: { createOne: {}, updateOne: {} },
        },
      ],
    });
    // The declaration is detached: editing it afterwards cannot widen a bound
    // Policy.
    policy.create.fields.length = 0;
    policy.create.relations.children.create.fields.length = 0;
    router.route('/api', await contribution.createRouter({ container }));
    const api = client();
    const parents = api.repository('policyParents');
    await parents.createOne({
      values: {
        id: 'parent',
        children: { create: { id: 'child', label: 'Original' } },
      },
    });
    await parents.updateOne({
      filter: { id: 'parent' },
      values: {
        children: {
          update: { filter: { id: 'child' }, values: { label: 'Updated' } },
        },
      },
    });
    await expect(
      parents.updateOne({
        filter: { id: 'parent' },
        values: {
          children: {
            update: {
              filter: { id: 'child' },
              values: { label: 'Must roll back', parentId: 'other' },
            },
          },
        },
      }),
    ).rejects.toMatchObject({ status: 403, reason: 'FIELD_WRITE_FORBIDDEN' });
    await expect(
      parents.updateOne({
        filter: { id: 'parent' },
        values: { children: { create: { id: 'second' } } },
      }),
    ).rejects.toMatchObject({
      status: 403,
      reason: 'RELATION_WRITE_FORBIDDEN',
    });
    await expect(
      api.repository('policyClosed').createOne({
        values: { id: 'closed', children: { create: { id: 'denied' } } },
      }),
    ).rejects.toMatchObject({ status: 403, reason: 'WRITE_FORBIDDEN' });
    const rejected = await router.request('/api/policyClosed/updateOne', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        filter: { id: 'parent' },
        values: { children: { delete: { filter: { id: 'child' } } } },
      }),
    });
    expect(rejected.status).toBe(403);
    expect(await rejected.json()).toMatchObject({
      error: { reason: 'WRITE_FORBIDDEN' },
    });
    for (const action of ['createOne', 'updateOne']) {
      const response = await router.request(`/api/policyClosed/${action}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...(action === 'updateOne' ? { filter: { id: 'parent' } } : {}),
          values: { id: 'injected' },
          policy: { read: true },
        }),
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: { reason: 'UNSUPPORTED_REPOSITORY_OPTION' },
      });
    }
    expect(await database.repository('policyParents').count()).toBe(1);
    expect(await database.repository('policyChildren').findMany()).toEqual([
      { id: 'child', parentId: 'parent', label: 'Updated' },
    ]);
  });

  it('enforces through field rules through the production HTTP adapter', async () => {
    await database.builder().createCollections([
      {
        name: 'policyTags',
        definition: (c) => {
          c.string('id').primary();
        },
      },
      {
        name: 'policyLinks',
        definition: (c) => {
          c.increments('id');
          c.string('parentId');
          c.string('tagId');
          c.string('role').nullable();
          c.integer('weight').defaultTo(0);
        },
      },
      {
        name: 'policyOwners',
        definition: (c) => {
          c.string('id').primary();
          c.belongsToMany('tags', 'policyTags')
            .sourceKey('id')
            .targetKey('id')
            .through('policyLinks')
            .foreignKey('parentId')
            .otherKey('tagId');
        },
      },
    ]);
    await database
      .repository('policyTags')
      .createOne({ values: { id: 'tag' } });
    await database
      .repository('policyOwners')
      .createOne({ values: { id: 'parent' } });
    const contribution = defineRepositoryApiRoutes({
      repositories: [
        {
          name: 'policyOwners',
          policy: buildRepositoryPolicy((p) =>
            p
              .read(true)
              .update((update) =>
                update
                  .scope(true)
                  .relation('tags', (tags) =>
                    tags.connect((edge) =>
                      edge.through((through) => through.fields('role')),
                    ),
                  ),
              ),
          ),
          actions: { updateOne: {} },
        },
      ],
    });
    router.route('/api', await contribution.createRouter({ container }));
    const owners = client().repository('policyOwners');
    await expect(
      owners.updateOne({
        filter: { id: 'parent' },
        values: {
          tags: {
            connect: {
              where: { id: 'tag' },
              through: { role: 'allowed', weight: 99 },
            },
          },
        },
      }),
    ).rejects.toMatchObject({ status: 403, reason: 'FIELD_WRITE_FORBIDDEN' });
    expect(await database.repository('policyLinks').count()).toBe(0);
    await owners.updateOne({
      filter: { id: 'parent' },
      values: {
        tags: {
          connect: { where: { id: 'tag' }, through: { role: 'allowed' } },
        },
      },
    });
    expect(await database.repository('policyLinks').findMany()).toMatchObject([
      { role: 'allowed', weight: 0 },
    ]);
  });

  it('denies a false write node even for empty values and exposes field diagnostics', async () => {
    const contribution = defineRepositoryApiRoutes({
      repositories: [
        {
          name: 'emptyNodePolicy',
          collection: 'orders',
          policy: {
            read: true,
            create: { scope: true },
            update: { scope: true },
            delete: false,
          },
          actions: { createOne: {}, updateOne: {} },
        },
        {
          name: 'falsePolicy',
          collection: 'orders',
          policy: { read: true, create: false, update: false, delete: false },
          actions: { createOne: {}, updateOne: {} },
        },
        {
          name: 'fieldsPolicy',
          collection: 'orders',
          policy: {
            read: true,
            create: { scope: true, fields: ['id'] },
            update: false,
            delete: false,
          },
          actions: { createOne: {} },
        },
      ],
    });
    router.route('/api', await contribution.createRouter({ container }));
    for (const name of ['falsePolicy']) {
      for (const action of ['createOne', 'updateOne']) {
        const response = await router.request(`/api/${name}/${action}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            ...(action === 'updateOne' ? { filter: { id: 'absent' } } : {}),
            values: {},
          }),
        });
        expect(response.status).toBe(403);
        expect(await response.json()).toMatchObject({
          error: { reason: 'WRITE_FORBIDDEN' },
        });
      }
    }
    // A node with no `fields` is not the same as `false`: it grants nothing to
    // the caller, so a create carrying a field is refused rather than the
    // write itself.
    const nothingAllowed = await router.request(
      '/api/emptyNodePolicy/createOne',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ values: { id: 'refused' } }),
      },
    );
    expect(nothingAllowed.status).toBe(403);
    expect(await nothingAllowed.json()).toMatchObject({
      error: { reason: 'FIELD_WRITE_FORBIDDEN' },
    });
    const response = await router.request('/api/fieldsPolicy/createOne', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ values: { id: 'forbidden', status: 'paid' } }),
    });
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: {
        reason: 'FIELD_WRITE_FORBIDDEN',
        metadata: {
          path: ['values', 'status'],
          details: { field: 'status', allowedFields: ['id'] },
        },
      },
    });
    expect(
      await database
        .repository('orders')
        .exists({ filter: { id: 'forbidden' } }),
    ).toBe(false);
  });

  it.each([
    { actions: ['count'] },
    { actions: { count: true } },
    { actions: { count: false } },
    { actions: { count: null } },
    { actions: { findMany: { maxLimit: null } } },
    { actions: { count: undefined } },
    { actions: { count: { maxLimit: 5 } } },
    { actions: { findMany: { maxLimit: -1 } } },
    { actions: { findMany: { writePolicy: false } } },
    { actions: { createOne: { policy: { read: true } } } },
    { actions: { missing: {} } },
    { actions: { count: {} }, maxLimit: 10 },
    { actions: {}, writePolicy: {} },
  ])('rejects invalid route configuration at declaration: %j', (invalid) => {
    expect(() =>
      defineRepositoryApiRoutes({
        repositories: [{ name: 'orders', policy: open, ...invalid }],
      } as unknown as DefineRepositoryApiRoutesOptions),
    ).toThrow();
  });

  it.each([
    { label: 'no policy at all', policy: undefined },
    { label: 'a null policy', policy: null },
    { label: 'a policy missing a node', policy: { read: true } },
    {
      label: 'a create granting an operation a create cannot perform',
      policy: {
        read: true,
        create: { scope: true, relations: { tasks: { delete: {} } } },
        update: true,
        delete: true,
      },
    },
    {
      label: 'a read node without a scope',
      policy: {
        read: { fields: ['id'] },
        create: true,
        update: true,
        delete: true,
      },
    },
  ])('rejects $label when the routes are defined', ({ policy }) => {
    expect(() =>
      defineRepositoryApiRoutes({
        repositories: [{ name: 'orders', policy, actions: { count: {} } }],
      } as unknown as DefineRepositoryApiRoutesOptions),
    ).toThrow();
  });

  it('rejects a policy reference these routes cannot expand', () => {
    expect(() =>
      defineRepositoryApiRoutes({
        repositories: [
          {
            name: 'orders',
            policy: {
              read: {
                scope: true,
                fields: ['id'],
                relations: { items: ref('orderItems') },
              },
              create: false,
              update: false,
              delete: false,
            },
            actions: { findMany: {} },
          },
        ],
      }),
    ).toThrowError(/ref\("orderItems"\)/);
  });

  it('requires a principal resolver as soon as a policy reads one', () => {
    expect(() =>
      defineRepositoryApiRoutes({
        repositories: [
          {
            name: 'orders',
            policy: () => open,
            actions: { findMany: {} },
          },
        ],
      }),
    ).toThrowError(/principal/);
  });

  it('round-trips relation builders, client keys, nested filters and numeric updates through HTTP', async () => {
    await database.builder().createCollection('builderChildren', (c) => {
      c.string('id').primary();
      c.string('parentId').nullable();
      c.integer('points').defaultTo(0);
    });
    await database.builder().createCollection('builderParents', (c) => {
      c.string('id').primary();
      c.json('metadata');
      c.hasMany('children', 'builderChildren')
        .sourceKey('id')
        .foreignKey('parentId');
    });
    const contribution = defineRepositoryApiRoutes({
      repositories: [
        {
          name: 'builderParents',
          policy: {
            read: true,
            create: {
              scope: true,
              fields: ['id', 'metadata'],
              relations: {
                children: { create: { fields: ['id', 'points'] } },
              },
            },
            update: {
              scope: true,
              relations: {
                children: {
                  update: { fields: ['points'] },
                  upsert: {
                    create: { fields: ['id', 'points'] },
                    update: { fields: ['points'] },
                  },
                  delete: {},
                },
              },
            },
            delete: true,
          },
          actions,
        },
      ],
    });
    router.route('/api', await contribution.createRouter({ container }));
    const parents = client().repository('builderParents');
    const created = await parents.createOne({
      values: {
        id: 'parent',
        metadata: { update: { arbitrary: 'data' }, increment: 3 },
        children: (r) =>
          r.create({ id: 'child', points: 2 }, { clientKey: 'local-child' }),
      },
      select: (s) =>
        s
          .fields('id', 'metadata')
          .include('children', (c) => c.fields('id', 'points')),
    });
    expect(created.createdTargets).toEqual([
      {
        clientKey: 'local-child',
        collection: 'builderChildren',
        unique: { kind: 'unique', fields: ['id'], values: { id: 'child' } },
      },
    ]);
    expect(created.record).toMatchObject({
      children: [{ id: 'child', points: 2 }],
    });
    const metadata: unknown =
      typeof created.record.metadata === 'string'
        ? JSON.parse(created.record.metadata)
        : created.record.metadata;
    expect(metadata).toEqual({ update: { arbitrary: 'data' }, increment: 3 });
    await parents.updateOne({
      filter: (f) => f.string('id').eq('parent'),
      values: {
        children: (r) =>
          r.update({
            filter: (f) => f.string('id').eq('child'),
            values: { points: (n) => n.increment(3) },
          }),
      },
    });
    expect(
      await parents.findOne({
        filter: { id: 'parent' },
        select: (s) =>
          s.fields('id').include('children', (c) =>
            c.combine({
              records: c
                .fields('id', 'points')
                .filter((f) => f.number('points').gte(3))
                .sort((s) => s.field('points').desc()),
              total: c.sum('points'),
            }),
          ),
      }),
    ).toEqual({
      id: 'parent',
      children: { records: [{ id: 'child', points: 5 }], total: '5' },
    });
    await expect(
      parents.createOne({
        values: {
          id: 'invalid',
          children: {
            create: {
              kind: 'relationCreate',
              version: 1,
              values: { id: 'bad' },
              clientKey: 42,
            },
          },
        },
      }),
    ).rejects.toMatchObject({ status: 400, reason: 'INVALID_MUTATION' });
  });

  it('supports anonymous client calls for all seven actions against a real database', async () => {
    const orders = client().repository<Order>('salesOrders');
    const created = await orders.createOne({
      values: { id: 'one', status: 'draft' },
    });
    expect(created).toMatchObject({
      record: { id: 'one', status: 'draft', version: 1 },
      createdTargets: [],
      version: 1,
    });
    expect(await orders.findOne({ filter: { id: 'one' } })).toEqual(
      created.record,
    );
    expect(await orders.findMany({ filter: { status: 'draft' } })).toEqual([
      created.record,
    ]);
    expect(await orders.count()).toBe(1);
    expect(await orders.exists({ filter: { id: 'one' } })).toBe(true);
    const updated = await orders.updateOne({
      filter: { id: 'one' },
      values: { status: 'paid' },
      ifVersion: created.version,
    });
    expect(updated).toMatchObject({
      record: { status: 'paid', version: 2 },
      version: 2,
    });
    await expect(
      orders.updateOne({
        filter: { id: 'one' },
        values: { status: 'draft' },
        ifVersion: 1,
      }),
    ).rejects.toMatchObject({ status: 409, reason: 'VERSION_CONFLICT' });
    expect(
      await orders.deleteOne({
        filter: { id: 'one' },
        ifVersion: updated.version,
      }),
    ).toEqual({ deleted: true });
    expect(await orders.findOne({ filter: { id: 'one' } })).toBeUndefined();
    expect(
      await (await request('findOne', { filter: { id: 'one' } })).json(),
    ).toEqual({ data: null });
    expect(await orders.exists({ filter: { id: 'one' } })).toBe(false);
    await expect(
      orders.deleteOne({ filter: { id: 'one' } }),
    ).rejects.toMatchObject({ status: 404, reason: 'RECORD_NOT_FOUND' });
  });

  it('aggregates all matching rows and groups with HAVING and sort through the HTTP client', async () => {
    await database.repository('orders').createMany({
      values: [
        { id: 'a', status: 'paid' },
        { id: 'b', status: 'paid' },
        { id: 'c', status: 'draft' },
      ],
    });
    const orders = client().repository<Order>('salesOrders');
    const aggregate = {
      kind: 'aggregate',
      version: 1,
      items: [
        { kind: 'count', alias: 'count' },
        { kind: 'sum', field: 'version', alias: 'total' },
        { kind: 'avg', field: 'version', alias: 'average' },
        { kind: 'min', field: 'version', alias: 'minimum' },
        { kind: 'max', field: 'version', alias: 'maximum' },
      ],
    } as const;
    // maxLimit restricts findMany, never the input rows of an aggregate.
    expect(
      withoutDecimalPadding(await orders.aggregate({ aggregate })),
    ).toEqual({
      count: 3,
      total: '3',
      average: '1',
      minimum: 1,
      maximum: 1,
    });
    expect(
      await orders.aggregate({ filter: { status: 'missing' }, aggregate }),
    ).toEqual({
      count: 0,
      total: null,
      average: null,
      minimum: null,
      maximum: null,
    });
    expect(
      await orders.aggregate({ filter: { status: 'paid' }, aggregate }),
    ).toMatchObject({ count: 2, total: '2' });
    expect(
      withoutDecimalPadding(
        await orders.groupBy({
          by: ['status'],
          aggregate,
          having: {
            kind: 'filter',
            version: 1,
            root: {
              kind: 'group',
              logic: 'and',
              items: [
                {
                  kind: 'condition',
                  path: ['count'],
                  operator: '$gte',
                  value: 2,
                },
              ],
            },
          },
          sort: {
            kind: 'sort',
            version: 1,
            items: [{ kind: 'field', path: ['total'], direction: 'desc' }],
          },
        }),
      ),
    ).toEqual([
      {
        status: 'paid',
        count: 2,
        total: '2',
        average: '1',
        minimum: 1,
        maximum: 1,
      },
    ]);
    expect(
      await orders.groupBy({
        by: ['status'],
        filter: { status: 'missing' },
        aggregate,
      }),
    ).toEqual([]);
    expect(
      await orders.groupBy({
        by: ['status'],
        aggregate,
        sort: {
          kind: 'sort',
          version: 1,
          items: [{ kind: 'field', path: ['count'], direction: 'desc' }],
        },
      }),
    ).toMatchObject([
      { status: 'paid', count: 2 },
      { status: 'draft', count: 1 },
    ]);
  });

  it('rejects invalid aggregate envelopes, ASTs, fields and unexposed actions', async () => {
    const aggregate = {
      kind: 'aggregate',
      version: 1,
      items: [{ kind: 'count', alias: 'count' }],
    };
    for (const [action, input] of [
      ['aggregate', {}],
      ['aggregate', { aggregate: [] }],
      ['aggregate', { aggregate: { ...aggregate, version: 2 } }],
      [
        'aggregate',
        {
          aggregate: {
            ...aggregate,
            items: [{ kind: 'raw', alias: 'x', sql: 'SELECT 1' }],
          },
        },
      ],
      [
        'aggregate',
        {
          aggregate: {
            ...aggregate,
            items: [{ kind: 'sum', field: 'missing', alias: 'x' }],
          },
        },
      ],
      ['aggregate', { aggregate, context: {} }],
      ['aggregate', { aggregate, limit: 1 }],
      ['groupBy', { aggregate }],
      ['groupBy', { aggregate, by: [] }],
      ['groupBy', { aggregate, by: [null] }],
      ['groupBy', { aggregate, by: ['missing'] }],
      ['groupBy', { aggregate, by: ['status'], having: [] }],
      ['groupBy', { aggregate, by: ['status'], having: { missing: 1 } }],
      [
        'groupBy',
        {
          aggregate,
          by: ['status'],
          sort: {
            kind: 'sort',
            version: 1,
            items: [{ kind: 'field', path: ['missing'], direction: 'asc' }],
          },
        },
      ],
    ] as const) {
      expect((await request(action, input)).status).toBe(400);
    }
    for (const action of ['aggregate', 'groupBy']) {
      const response = await router.request(`/api/catalog/${action}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ aggregate, by: ['status'] }),
      });
      expect(response.status).toBe(404);
    }
  });

  it('serializes bigint aggregate results as lossless decimal strings', async () => {
    // Router repositories are resolved at construction time, so mount a fresh contribution.
    const contribution = defineRepositoryApiRoutes({
      repositories: [
        {
          name: 'bigints',
          collection: 'orders',
          policy: open,
          actions: { aggregate: {} },
        },
      ],
    });
    vi.spyOn(stubScopedRepository(database), 'aggregate').mockResolvedValue({
      total: 9007199254740993n,
    });
    const app = await contribution.createRouter({ container });
    const response = await app.request('/bigints/aggregate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        aggregate: {
          kind: 'aggregate',
          version: 1,
          items: [{ kind: 'sum', field: 'version', alias: 'total' }],
        },
      }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: { total: '9007199254740993' },
    });
  });

  it('applies the default limit and forwards JSON filter, select, sort, offset and cursor', async () => {
    await database.repository('orders').createMany({
      values: [
        { id: 'a', status: 'draft' },
        { id: 'b', status: 'paid' },
        { id: 'c', status: 'paid' },
      ],
    });
    const orders = client().repository<Order>('salesOrders');
    expect(await orders.findMany()).toHaveLength(2);
    const sort = {
      kind: 'sort' as const,
      version: 1 as const,
      items: [{ kind: 'field', path: ['id'], direction: 'asc' }],
    };
    const select = {
      kind: 'select' as const,
      version: 1 as const,
      root: { kind: 'selection', fields: ['id'] },
    };
    expect(
      await orders.findMany({
        filter: {
          kind: 'filter',
          version: 1,
          root: {
            kind: 'group',
            logic: 'and',
            items: [
              {
                kind: 'condition',
                path: ['status'],
                operator: '$eq',
                value: 'paid',
              },
            ],
          },
        },
        sort,
        select,
        offset: 1,
        limit: 1,
      }),
    ).toEqual([{ id: 'c' }]);
    expect(
      await orders.findMany({ sort, select, cursor: { id: 'a' }, limit: 1 }),
    ).toEqual([{ id: 'b' }]);
    expect(await orders.findMany({ limit: 0 })).toEqual([]);
    expect(await orders.count({ filter: { status: 'paid' } })).toBe(2);
  });

  it('streams findMany records as framed NDJSON', async () => {
    await database.repository('orders').createMany({
      values: [
        { id: 'a', status: 'draft' },
        { id: 'b', status: 'paid' },
        { id: 'c', status: 'paid' },
      ],
    });
    const response = await router.request('/api/salesOrders/findMany', {
      method: 'POST',
      headers: {
        accept: 'application/x-ndjson',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        filter: { status: 'paid' },
        sort: {
          kind: 'sort',
          version: 1,
          items: [{ kind: 'field', path: ['id'], direction: 'asc' }],
        },
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(
      'application/x-ndjson; charset=utf-8',
    );
    expect(response.headers.get('vary')).toBe('Accept');
    expect(
      (await response.text())
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line) as unknown),
    ).toEqual([
      {
        type: 'record',
        data: { id: 'b', status: 'paid', version: 1 },
      },
      {
        type: 'record',
        data: { id: 'c', status: 'paid', version: 1 },
      },
      { type: 'end' },
    ]);
  });

  it('streams findMany records through the public API client', async () => {
    await database.repository('orders').createMany({
      values: [
        { id: 'a', status: 'draft' },
        { id: 'b', status: 'paid' },
        { id: 'c', status: 'paid' },
      ],
    });

    await expect(
      collect(
        client()
          .repository<Order>('salesOrders')
          .findMany({
            filter: { status: 'paid' },
            sort: (s) => s.field('id').asc(),
          }),
      ),
    ).resolves.toEqual([
      { id: 'b', status: 'paid', version: 1 },
      { id: 'c', status: 'paid', version: 1 },
    ]);
  });

  it('returns preflight Repository errors as HTTP errors before streaming starts', async () => {
    const response = await router.request('/api/salesOrders/findMany', {
      method: 'POST',
      headers: {
        accept: 'application/x-ndjson',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ filter: { missingField: 'x' } }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { reason: 'FIELD_NOT_FOUND', message: expect.any(String) },
    });
  });

  it('frames Repository errors that occur after streaming starts', async () => {
    const streamed = (async function* (): AsyncIterable<
      Record<string, unknown>
    > {
      yield { id: 'a', status: 'paid', version: 1 };
      throw new RepositoryError('INVALID_FILTER', 'Streaming query failed.');
    })();
    vi.spyOn(stubScopedRepository(database), 'findMany').mockReturnValue(
      streamed as RepositoryQuery<Record<string, unknown>>,
    );
    const contribution = defineRepositoryApiRoutes({
      repositories: [
        {
          name: 'streamError',
          collection: 'orders',
          policy: open,
          actions: { findMany: {} },
        },
      ],
    });
    router.route('/api', await contribution.createRouter({ container }));

    const response = await router.request('/api/streamError/findMany', {
      method: 'POST',
      headers: {
        accept: 'application/x-ndjson',
        'content-type': 'application/json',
      },
      body: '{}',
    });

    expect(response.status).toBe(200);
    expect(
      (await response.text())
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line) as unknown),
    ).toEqual([
      {
        type: 'record',
        data: { id: 'a', status: 'paid', version: 1 },
      },
      {
        type: 'error',
        error: {
          code: 400,
          status: 'INVALID_ARGUMENT',
          reason: 'INVALID_FILTER',
          domain: 'app',
          message: 'Streaming query failed.',
        },
      },
    ]);
  });

  it('maps Policy error codes to their HTTP status', async () => {
    // A status these codes do not have is not a cosmetic problem: 400 tells a
    // caller their request was malformed, when in fact it was refused.
    const expected = [
      ['READ_FORBIDDEN', 403],
      ['FIELD_READ_FORBIDDEN', 403],
      ['RELATION_READ_FORBIDDEN', 403],
      ['SCOPE_VIOLATION', 403],
      ['RECORD_OUTSIDE_SCOPE', 409],
    ] as const;

    for (const [code, status] of expected) {
      vi.spyOn(stubScopedRepository(database), 'count').mockRejectedValue(
        new RepositoryError(code, `${code} raised.`),
      );

      const contribution = defineRepositoryApiRoutes({
        repositories: [
          {
            name: `policyStatus${code.replaceAll('_', '')}`,
            collection: 'orders',
            policy: open,
            actions: { count: {} },
          },
        ],
      });
      const scopedRouter = new Hono();
      scopedRouter.route(
        '/api',
        await contribution.createRouter({ container }),
      );

      const response = await scopedRouter.request(
        `/api/policyStatus${code.replaceAll('_', '')}/count`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{}',
        },
      );

      expect({ code, status: response.status }).toEqual({ code, status });
      expect(response.status).toBe(status);
      expect(await response.json()).toMatchObject({ error: { reason: code } });
      vi.restoreAllMocks();
    }
  });

  it('binds a declared policy and refuses one sent in the body', async () => {
    await database.repository('orders').createMany({
      values: [
        { id: 'paid-1', status: 'paid' },
        { id: 'draft-1', status: 'draft' },
      ],
    });
    const contribution = defineRepositoryApiRoutes({
      repositories: [
        {
          name: 'scopedOrders',
          collection: 'orders',
          policy: {
            read: { scope: { status: 'paid' }, fields: ['id', 'status'] },
            create: { scope: true },
            update: { scope: true },
            delete: { scope: true },
          },
          actions: { findMany: {} },
        },
      ],
    });
    const scopedRouter = new Hono();
    scopedRouter.route('/api', await contribution.createRouter({ container }));

    const listed = await scopedRouter.request('/api/scopedOrders/findMany', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    expect(listed.status).toBe(200);
    const body = (await listed.json()) as { data: Array<{ status: string }> };
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.every((record) => record.status === 'paid')).toBe(true);

    // A field the policy does not grant is refused, not quietly trimmed.
    const forbidden = await scopedRouter.request('/api/scopedOrders/findMany', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        select: {
          kind: 'select',
          version: 1,
          root: { kind: 'selection', fields: ['id', 'version'] },
        },
      }),
    });
    expect(forbidden.status).toBe(403);

    // And the caller cannot supply a policy of their own: a policy that the
    // request could set would let it grant itself anything.
    for (const key of ['policy', 'scope']) {
      const smuggled = await scopedRouter.request(
        '/api/scopedOrders/findMany',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ [key]: { read: true } }),
        },
      );
      expect(smuggled.status).toBe(400);
      expect(await smuggled.json()).toMatchObject({
        error: { reason: 'UNSUPPORTED_REPOSITORY_OPTION' },
      });
    }
  });

  it('binds a policy built from the request principal', async () => {
    await database.repository('orders').createMany({
      values: [
        { id: 'mine-1', status: 'mine' },
        { id: 'theirs-1', status: 'theirs' },
      ],
    });
    const seen: Array<string | undefined> = [];
    const contribution = defineRepositoryApiRoutes<{ status: string }>({
      principal: (context) => {
        const status = context.req.header('x-actor');
        seen.push(status);
        return status === undefined ? undefined! : { status };
      },
      repositories: [
        {
          name: 'principalOrders',
          collection: 'orders',
          policy: (principal) => ({
            read: { scope: { status: principal.status }, fields: ['id'] },
            create: false,
            update: false,
            delete: false,
          }),
          actions: { findMany: {} },
        },
      ],
    });
    const principalRouter = new Hono();
    principalRouter.route(
      '/api',
      await contribution.createRouter({ container }),
    );
    const request = (actor?: string): Promise<Response> =>
      principalRouter.request('/api/principalOrders/findMany', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(actor === undefined ? {} : { 'x-actor': actor }),
        },
        body: '{}',
      });

    const mine = await request('mine');
    expect(mine.status).toBe(200);
    expect(await mine.json()).toEqual({ data: [{ id: 'mine-1' }] });

    // The next request is scoped to its own principal, not to the last one.
    const theirs = await request('theirs');
    expect(await theirs.json()).toEqual({ data: [{ id: 'theirs-1' }] });
    expect(seen).toEqual(['mine', 'theirs']);

    // No principal, no Policy, so the request is refused rather than bound to
    // an unrestricted Repository.
    const anonymous = await request();
    expect(anonymous.status).toBe(403);
    expect(await anonymous.json()).toMatchObject({
      error: { reason: 'PRINCIPAL_REQUIRED' },
    });
  });

  it('rejects a reference in a Policy built from the principal', async () => {
    const contribution = defineRepositoryApiRoutes<string>({
      principal: () => 'actor',
      repositories: [
        {
          name: 'referencingOrders',
          collection: 'orders',
          policy: () => ({
            read: {
              scope: true,
              fields: ['id'],
              relations: { items: ref('orderItems') },
            },
            create: false,
            update: false,
            delete: false,
          }),
          actions: { findMany: {} },
        },
      ],
    });
    const referencingRouter = new Hono();
    referencingRouter.route(
      '/api',
      await contribution.createRouter({ container }),
    );
    // A reference these routes cannot expand would otherwise surface as a 403
    // on a relation the Policy appears to grant.
    expect(
      (
        await referencingRouter.request('/api/referencingOrders/findMany', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{}',
        })
      ).status,
    ).toBe(500);
  });

  it('reports a Policy the server could not build as a server error', async () => {
    const contribution = defineRepositoryApiRoutes<string>({
      principal: () => 'actor',
      repositories: [
        {
          name: 'brokenPrincipalOrders',
          collection: 'orders',
          // `scope` is missing, which only shows once the function runs.
          policy: () => ({ read: { fields: ['id'] } }) as never,
          actions: { count: {} },
        },
      ],
    });
    const brokenRouter = new Hono();
    brokenRouter.route('/api', await contribution.createRouter({ container }));
    const response = await brokenRouter.request(
      '/api/brokenPrincipalOrders/count',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      },
    );
    // Not 400: the request is fine, the Policy behind it is not.
    expect(response.status).toBe(500);
  });

  it('does not expose undeclared collections or actions and preserves other routes', async () => {
    for (const path of [
      '/api/orders/findMany',
      '/api/catalog/createOne',
      '/api/salesOrders/deleteMany',
      '/api/users/findMany',
      // The colon separator is gone; only the slash form is routed.
      '/api/salesOrders:findMany',
    ]) {
      expect((await router.request(path, { method: 'POST' })).status).toBe(404);
    }
    expect((await router.request('/api/salesOrders/findMany')).status).toBe(
      404,
    );
    expect(await (await router.request('/api/unrelated')).json()).toEqual({
      ok: true,
    });
  });

  it.each([
    ['findMany', null],
    ['findMany', []],
    ['findMany', { context: {} }],
    ['findMany', { limit: 3 }],
    ['findMany', { limit: -1 }],
    ['findMany', { limit: '1' }],
    ['findMany', { filter: [] }],
    ['findMany', { sort: null }],
    ['findMany', { filter: { missingField: 'x' } }],
    ['findOne', {}],
    ['createOne', {}],
    ['updateOne', { values: {} }],
    ['deleteOne', {}],
    [
      'createOne',
      { values: { id: 'one', status: 'draft' }, idempotencyKey: 'key' },
    ],
  ])('rejects invalid %s input without writing: %j', async (action, input) => {
    const response = await request(action as string, input);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: {
        status: 'INVALID_ARGUMENT',
        reason: expect.any(String),
        message: expect.any(String),
      },
    });
    expect(await database.repository('orders').count()).toBe(0);
  });

  it('rejects malformed JSON, non-JSON requests and oversized bodies', async () => {
    const path = '/api/salesOrders/findMany';
    expect(
      (
        await router.request(path, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{',
        })
      ).status,
    ).toBe(400);
    expect(
      (await router.request(path, { method: 'POST', body: '{}' })).status,
    ).toBe(415);
    expect(
      (
        await request('createOne', {
          values: { id: 'big', status: 'x'.repeat(1024 * 1024) },
        })
      ).status,
    ).toBe(413);
    expect(await database.repository('orders').count()).toBe(0);
  });

  it('keeps unexpected failures as server errors rather than invalid input', async () => {
    router.onError((error, context) =>
      apiErrorHandler(toApiError(error), context),
    );
    vi.spyOn(stubScopedRepository(database), 'count').mockRejectedValue(
      new Error('Database unavailable'),
    );
    const contribution = defineRepositoryApiRoutes({
      repositories: [{ name: 'broken', policy: open, actions: { count: {} } }],
    });
    router.route('/api', await contribution.createRouter({ container }));
    await expect(
      client().repository('broken').count(),
    ).rejects.toMatchObject<ApiClientError>({
      status: 500,
      reason: 'INTERNAL_ERROR',
      message: 'Internal server error.',
    });
  });

  it('snapshots declarations and resolves the configured connection only at router creation', async () => {
    const repository = database.repository('orders');
    const resolve = vi
      .spyOn(database, 'repository')
      .mockReturnValue(repository);
    const entries = [
      {
        name: 'external',
        collection: 'orders',
        connection: 'secondary',
        policy: open,
        actions: { count: {} } as RepositoryApiActions,
      },
    ];
    const contribution = defineRepositoryApiRoutes({ repositories: entries });
    defineServerPlugin({
      baseDir: import.meta.dirname,
      packageName: '@nocobase/app-plugin-test',
      routes: [contribution],
    });
    expect(contribution.scope).toBe('api');
    expect(resolve).not.toHaveBeenCalled();
    entries[0]!.actions = { count: {}, deleteOne: {} };
    entries[0]!.collection = 'changed';
    const routes = await contribution.createRouter({ container });
    expect(resolve).toHaveBeenCalledWith('orders', 'secondary');
    expect(
      (await routes.request('/external/deleteOne', { method: 'POST' })).status,
    ).toBe(404);
    expect(
      await (
        await routes.request('/external/count', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{}',
        })
      ).json(),
    ).toEqual({ data: 0 });
  });

  it.each([
    'sales/orders',
    'sales%2Forders',
    'sales:orders',
    'sales-orders',
    'sales_orders',
    'SalesOrders',
    '1orders',
    'sales orders',
  ])(
    'rejects the exposure name %j, which is not a camelCase segment',
    (name) => {
      expect(() =>
        defineRepositoryApiRoutes({
          repositories: [{ name, policy: open, actions: { count: {} } }],
        }),
      ).toThrow(
        `Repository API exposure name ${JSON.stringify(name)} is invalid. Exposure names are camelCase path segments matching /^[a-z][a-zA-Z0-9]*$/, such as "salesOrders".`,
      );
    },
  );

  it.each(['auth', 'healthz', 'swagger'])(
    'rejects the exposure name %j, which the application already answers under /api',
    (name) => {
      expect(() =>
        defineRepositoryApiRoutes({
          repositories: [{ name, policy: open, actions: { count: {} } }],
        }),
      ).toThrow(`Repository API exposure name "${name}" is reserved`);
    },
  );

  it('accepts camelCase exposure names with digits', () => {
    expect(() =>
      defineRepositoryApiRoutes({
        repositories: [
          { name: 'orders2026', policy: open, actions: { count: {} } },
          { name: 'salesOrderItems', policy: open, actions: { count: {} } },
        ],
      }),
    ).not.toThrow();
  });

  it('rejects ambiguous declarations and permits an empty exposure list without database services', async () => {
    for (const name of ['', '*', 'orders*']) {
      expect(() =>
        defineRepositoryApiRoutes({
          repositories: [{ name, policy: open, actions: { count: {} } }],
        }),
      ).toThrow();
    }
    expect(() =>
      defineRepositoryApiRoutes({
        repositories: [
          { name: 'orders', policy: open, actions: {} },
          { name: 'orders', policy: open, actions: {} },
        ],
      }),
    ).toThrow(
      'Repository API exposure name "orders" is declared more than once',
    );
    expect(() =>
      defineRepositoryApiRoutes({
        repositories: [
          {
            name: 'orders',
            policy: open,
            actions: { unknown: {} } as RepositoryApiActions,
          },
        ],
      }),
    ).toThrow();
    expect(() =>
      defineRepositoryApiRoutes({
        repositories: [
          {
            name: 'orders',
            policy: open,
            actions: { findMany: { maxLimit: 0 } },
          },
        ],
      }),
    ).toThrow();
    const empty = defineRepositoryApiRoutes({
      repositories: [{ name: 'disabled', policy: open, actions: {} }],
    });
    expect(
      (
        await (
          await empty.createRouter({ container: new ServiceContainer() })
        ).request('/anything')
      ).status,
    ).toBe(404);
  });
});
