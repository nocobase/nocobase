// @vitest-environment node

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  Auth,
  authenticationToken,
  createUserAdministrationService,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication/server';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import {
  createAuthorization,
  grantBacked,
  ResourceItems,
  type Authorization,
  type AuthorizationEnv,
  type AuthorizationGrantService,
} from '@nocobase/authorization/core';
import { createMigrator, type DatabaseManager } from '@nocobase/db';
import { Hono } from 'hono';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { apiKey } from '../server/api-keys.js';
import { apiRoutes } from '../server/routes/index.js';
import { ScopedApiKeys } from '../server/scoped-keys.js';
import { createApiKeyScopes, type ApiKeyScopes } from '../server/scopes.js';
import { scopedApiKeysToken } from '../server/tokens.js';
import {
  decodeKeyPermissions,
  encodeKeyScope,
  type KeyPermissions,
} from '../shared/scopes.js';

const require = createRequire(import.meta.url);
const BASE_URL = 'http://localhost/api/auth';
const PASSWORD = 'password-at-least-8';

const orders = { type: 'settings', id: 'orders' } as const;
const accounts = { type: 'settings', id: 'accounts' } as const;
const billing = { type: 'settings', id: 'billing' } as const;
const ordersPage = { type: 'page', id: 'orders' } as const;

/** The person holds orders, accounts and the orders page, never billing. */
function personGrants(): AuthorizationGrantService {
  const grants = [
    ...['read', 'update', 'create'].map((action) => ({
      resource: orders,
      action,
    })),
    { resource: accounts, action: 'read' },
    { resource: accounts, action: 'manage' },
    { resource: ordersPage, action: 'access' },
  ].map((grant) => ({ ...grant, source: { plugin: 'test', id: 'person' } }));
  return {
    resolveAll: () => Promise.resolve(grants),
    resolve: (input) =>
      Promise.resolve(
        grants.filter(
          (grant) =>
            grant.resource.type === input.resource.type &&
            grant.resource.id === input.resource.id &&
            grant.action === input.action,
        ),
      ),
  };
}

const orderRecords = [
  { id: 'o-1', title: 'Order 1' },
  { id: 'o-2', title: 'Order 2' },
];

describe('API key permissions in the shape of a permission set', () => {
  let testDatabase: TestDatabase;
  let database: DatabaseManager;
  let auth: Auth;
  let authz: Authorization;
  let scopes: ApiKeyScopes;
  let keys: ScopedApiKeys;
  let personId = '';
  let users: ReturnType<typeof createUserAdministrationService>;
  let cookie = '';
  let app: Hono;

  beforeAll(async () => {
    testDatabase = await createTestDatabase();
    database = testDatabase.database;
    for (const [packageName, directory] of [
      [
        '@nocobase/app-plugin-authentication',
        path.join(
          path.dirname(
            require.resolve('@nocobase/app-plugin-authentication/package.json'),
          ),
          'database/migrations',
        ),
      ],
      [
        '@nocobase/app-plugin-api-keys',
        fileURLToPath(new URL('../database/migrations', import.meta.url)),
      ],
    ] as const)
      await createMigrator({ database, packageName, directory }).latest();

    auth = new Auth({
      connection: database.connection(),
      baseURL: BASE_URL,
      secret: 'development-secret-at-least-32-characters',
      plugins: [apiKey()],
      emailAndPassword: { enabled: true },
      session: { storeSessionInDatabase: true },
    });
    users = createUserAdministrationService({
      auth,
      connection: database.connection(),
    });
    personId = (
      await users.create({
        name: 'Ada',
        email: 'ada@example.com',
        password: PASSWORD,
      })
    ).id;

    authz = createAuthorization({
      plugins: [
        {
          id: 'test',
          grants: personGrants(),
          setup(setup) {
            const settings = new ResourceItems();
            settings.add({
              id: 'orders',
              title: 'Orders',
              actions: ['read', 'update', 'create'],
            });
            settings.add({
              id: 'accounts',
              title: 'Accounts',
              actions: [
                'read',
                { name: 'manage', humanOnly: 'Manages people', risk: 'high' },
              ],
            });
            settings.add({
              id: 'billing',
              title: 'Billing',
              actions: ['read'],
            });
            setup.resourceTypes.add({
              type: 'settings',
              items: settings,
              authorize: grantBacked(),
            });
            const pages = new ResourceItems();
            pages.add({ id: 'orders', title: 'Orders', actions: ['access'] });
            setup.resourceTypes.add({
              type: 'page',
              items: pages,
              authorize: grantBacked(),
            });
          },
        },
      ],
    });
    const records = {
      list: ({ ids }: { ids?: readonly string[] }) =>
        Promise.resolve(
          orderRecords.filter((item) => !ids || ids.includes(item.id)),
        ),
    };
    authz.credentials.objectSources.add('orders', records);
    authz.credentials.templates.add({
      id: 'shop.ci',
      title: 'CI',
      expiresInDays: 30,
      grants: [
        { resource: orders, actions: ['read', 'update'], objects: 'pick' },
        { resource: accounts, actions: ['manage'] },
      ],
    });
    scopes = createApiKeyScopes();
    scopes.groups.add({
      id: 'shop.orders',
      category: 'business',
      title: 'Orders',
      levels: {
        read: [
          { kind: 'page', id: 'orders' },
          { kind: 'settings', id: 'orders', action: 'read' },
        ],
        write: [
          { kind: 'settings', id: 'orders', action: 'update' },
          { kind: 'settings', id: 'accounts', action: 'manage' },
        ],
      },
    });
    scopes.presets.add({
      id: 'orders-writer',
      title: 'Orders writer',
      groups: { 'shop.orders': { level: 'write' } },
    });
    keys = new ScopedApiKeys({
      auth,
      connection: () => database.connection(),
      scopes,
      authorization: () => authz,
      config: () => ({}),
    });
    // What the plugin's provider wires at boot.
    auth.addScopedCredentialCheck(
      async (session, request) =>
        (await keys.resolve(session, request)) !== null,
    );
    authz.use(async (request, next) => {
      const session = request.http.get('auth' as never) as Parameters<
        typeof keys.resolve
      >[0];
      request.principal = { type: 'user', id: session.user.id };
      const scope = await keys.credentialScope(session, request.http.req.raw);
      if (scope) request.keyScope = scope;
      await next();
    });

    const routes = new Hono<{
      Variables: AuthEnv['Variables'] & AuthorizationEnv['Variables'];
    }>();
    routes.get('/plain', auth.required(), (context) =>
      context.json({ ok: true }),
    );
    routes.get(
      '/settings/:id/:action',
      auth.required({ scopedKeys: true }),
      authz.middleware(),
      async (context) => {
        const decision = await context.get('authz').authorize({
          resource: { type: 'settings', id: context.req.param('id') },
          action: context.req.param('action'),
        });
        return context.json(
          { effect: decision.effect, reason: decision.reasons[0]?.code },
          decision.effect === 'permit' ? 200 : 403,
        );
      },
    );
    app = routes as unknown as Hono;

    const signIn = await auth.handler(
      new Request(`${BASE_URL}/sign-in/email`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost',
        },
        body: JSON.stringify({ email: 'ada@example.com', password: PASSWORD }),
      }),
    );
    cookie = signIn.headers
      .getSetCookie()
      .map((header) => header.split(';')[0])
      .join('; ');
  });

  afterAll(async () => {
    await testDatabase.destroy();
  });

  const identity = () => keys.identityOf(personId);
  const asKey = (secret: string) => ({ headers: { 'x-api-key': secret } });
  const asPerson = () => ({
    headers: { cookie, origin: 'http://localhost' },
  });
  const storedPermissions = async (keyId: string) =>
    (
      await database
        .connection()
        .query.selectFrom('apikey')
        .select(['permissions'])
        .where('id', '=', keyId)
        .executeTakeFirst<{ permissions: string | null }>()
    )?.permissions ?? null;

  const ordersReadUpdate: KeyPermissions = {
    grants: [
      {
        resource: orders,
        actions: [{ action: 'read' }, { action: 'update' }],
      },
    ],
  };

  it('creates a key with permissions and enforces exactly them', async () => {
    const created = await keys.create(
      personId,
      { name: 'ci', expiresInDays: 7, permissions: ordersReadUpdate },
      await identity(),
    );
    expect(created.key.permissions).toEqual(ordersReadUpdate);
    expect(created.key.scope).toEqual({ groups: {} });
    expect(JSON.parse((await storedPermissions(created.key.id))!)).toEqual({
      $v: '2',
      ...ordersReadUpdate,
    });
    for (const [action, status] of [
      ['read', 200],
      ['update', 200],
      ['create', 403],
    ] as const)
      expect(
        (await app.request(`/settings/orders/${action}`, asKey(created.secret)))
          .status,
      ).toBe(status);
    // A key with permissions is scoped: a route that does not take scoped keys refuses it.
    expect((await app.request('/plain', asKey(created.secret))).status).toBe(
      403,
    );
  });

  it('refuses permissions a key may not hold or the person does not', async () => {
    const who = await identity();
    const attempt = (permissions: unknown, extra: object = {}) =>
      keys.create(
        personId,
        { name: 'k', expiresInDays: 7, permissions, ...extra },
        who,
      );
    await expect(
      attempt({
        grants: [{ resource: accounts, actions: [{ action: 'manage' }] }],
      }),
    ).rejects.toMatchObject({ code: 'KEY_ACTION_HUMAN_ONLY' });
    await expect(
      attempt({
        grants: [{ resource: billing, actions: [{ action: 'read' }] }],
      }),
    ).rejects.toMatchObject({ status: 403, code: 'KEY_SCOPE_EXCEEDS_YOURS' });
    await expect(
      attempt({
        grants: [{ resource: orders, actions: [{ action: 'drop' }] }],
      }),
    ).rejects.toMatchObject({ code: 'UNKNOWN_PERMISSION' });
    await expect(attempt({ grants: [] })).rejects.toMatchObject({
      code: 'EMPTY_SCOPE',
    });
    await expect(
      attempt(ordersReadUpdate, {
        scope: { groups: { 'shop.orders': { level: 'read' } } },
      }),
    ).rejects.toMatchObject({ code: 'INVALID_SCOPE' });
    await expect(
      attempt({
        grants: [
          {
            resource: orders,
            actions: [{ action: 'read', policy: { type: 'composite' } }],
          },
        ],
      }),
    ).rejects.toMatchObject({ code: 'INVALID_SCOPE' });
    await expect(
      attempt({ ...ordersReadUpdate, objects: { orders: ['o-9'] } }),
    ).rejects.toMatchObject({ code: 'UNKNOWN_SCOPE_OBJECT' });
    await expect(
      attempt({ ...ordersReadUpdate, objects: { billing: ['b-1'] } }),
    ).rejects.toMatchObject({ code: 'SCOPE_OBJECTS_NOT_OFFERED' });
    const limited = await attempt({
      ...ordersReadUpdate,
      objects: { orders: ['o-2', 'o-2'] },
    });
    expect(limited.key.permissions?.objects).toEqual({ orders: ['o-2'] });
  });

  it('lets a session take a human-only action and refuses it to every kind of key with KEY_HUMAN_ONLY', async () => {
    const who = await identity();
    // Every key below may read accounts; none may manage them.
    const custom = await keys.create(
      personId,
      {
        name: 'custom',
        expiresInDays: 7,
        permissions: {
          grants: [
            { resource: accounts, actions: [{ action: 'read' }] },
            { resource: orders, actions: [{ action: 'update' }] },
          ],
        },
      },
      who,
    );
    const full = await keys.create(
      personId,
      { name: 'full', expiresInDays: 7, scope: null },
      who,
    );
    expect(full.key.permissions).toBeNull();
    const robot = await users.createServiceAccount({ name: 'Robot' });
    const service = await keys.create(
      robot.id,
      { name: 'robot', expiresInDays: null, scope: null },
      who,
    );
    // A deprecated group that maps to the human-only action loses it on conversion.
    const legacy = await keys.create(
      personId,
      {
        name: 'legacy',
        expiresInDays: 7,
        scope: { groups: { 'shop.orders': { level: 'write' } } },
      },
      who,
    );
    expect(legacy.key.permissions?.grants).not.toContainEqual(
      expect.objectContaining({ resource: accounts }),
    );

    const manage = (init: RequestInit) =>
      app.request('/settings/accounts/manage', init);
    const session = await manage(asPerson());
    expect(session.status).toBe(200);
    for (const [label, secret, readsAccounts] of [
      ['a key with permissions', custom.secret, true],
      ['a key without permissions', full.secret, true],
      ['a service account’s key', service.secret, true],
      ['a key converted from a group', legacy.secret, false],
    ] as const) {
      const refused = await manage(asKey(secret));
      expect([label, refused.status, await refused.json()]).toEqual([
        label,
        403,
        { effect: 'deny', reason: 'KEY_HUMAN_ONLY' },
      ]);
      expect([
        label,
        (await app.request('/settings/accounts/read', asKey(secret))).status,
      ]).toEqual([label, readsAccounts ? 200 : 403]);
    }
    // Routes that do not take scoped keys still take a person's key without permissions, as before.
    expect((await app.request('/plain', asKey(full.secret))).status).toBe(200);
  });

  it('stores a deprecated scope converted, and answers it unchanged', async () => {
    const scope = { groups: { 'shop.orders': { level: 'read' as const } } };
    const created = await keys.create(
      personId,
      { name: 'old', expiresInDays: 7, scope },
      await identity(),
    );
    expect(created.key.scope).toEqual(scope);
    expect(
      decodeKeyPermissions(await storedPermissions(created.key.id)),
    ).toEqual({
      version: '2',
      permissions: {
        grants: [
          { resource: ordersPage, actions: [{ action: 'access' }] },
          { resource: orders, actions: [{ action: 'read' }] },
        ],
      },
      legacy: scope,
    });
    // `setScope` keeps the deprecated groups too.
    const changed = await keys.setScope(
      personId,
      created.key.id,
      { groups: { 'shop.orders': { level: 'write' } } },
      await identity(),
    );
    expect(changed.scope).toEqual({
      groups: { 'shop.orders': { level: 'write' } },
    });
    expect(changed.permissions?.grants).toContainEqual({
      resource: orders,
      actions: [{ action: 'read' }, { action: 'update' }],
    });
  });

  it('converts keys stored in format 1 once their groups are all registered, never widening them', async () => {
    const make = async (name: string, permissions: unknown) => {
      const created = await keys.create(
        personId,
        { name, expiresInDays: 7, scope: null },
        await identity(),
      );
      await database
        .connection()
        .query.updateTable('apikey')
        .set({ permissions: JSON.stringify(permissions) })
        .where('id', '=', created.key.id)
        .execute();
      return created;
    };
    const known = await make(
      'v1-known',
      encodeKeyScope({ groups: { 'shop.orders': { level: 'write' } } }),
    );
    const unknown = await make(
      'v1-unknown',
      encodeKeyScope({
        groups: {
          'shop.orders': { level: 'read' },
          'shop.gone': { level: 'read' },
        },
      }),
    );
    const unknownBefore = await storedPermissions(unknown.key.id);
    // Before converting, a format-1 key is enforced from its groups.
    expect(
      (await app.request('/settings/orders/update', asKey(known.secret)))
        .status,
    ).toBe(200);

    // One key a batch: every batch is read, however many there are.
    const first = await keys.upgradeLegacyScopes({ batchSize: 1 });
    expect(first).toMatchObject({ failed: 0, failedKeyIds: [] });
    expect(first.converted).toBeGreaterThanOrEqual(1);
    expect(first.kept).toBeGreaterThanOrEqual(1);
    expect(decodeKeyPermissions(await storedPermissions(known.key.id))).toEqual(
      {
        version: '2',
        permissions: {
          grants: [
            { resource: accounts, actions: [] },
            { resource: ordersPage, actions: [{ action: 'access' }] },
            {
              resource: orders,
              actions: [{ action: 'read' }, { action: 'update' }],
            },
          ].filter((grant) => grant.actions.length > 0),
        },
        legacy: { groups: { 'shop.orders': { level: 'write' } } },
      },
    );
    expect(await storedPermissions(unknown.key.id)).toBe(unknownBefore);
    expect(await keys.upgradeLegacyScopes()).toMatchObject({
      converted: 0,
      failed: 0,
    });

    // Same answers after converting; the human-only action the group covered stays denied.
    for (const [path, status] of [
      ['/settings/orders/update', 200],
      ['/settings/orders/create', 403],
      ['/settings/accounts/manage', 403],
    ] as const)
      expect((await app.request(path, asKey(known.secret))).status).toBe(
        status,
      );
    expect((await keys.get(personId, known.key.id)).scope).toEqual({
      groups: { 'shop.orders': { level: 'write' } },
    });
  });

  it('leaves a key that fails to convert in format 1, reporting its id only', async () => {
    const created = await keys.create(
      personId,
      { name: 'v1-failing', expiresInDays: 7, scope: null },
      await identity(),
    );
    const v1 = JSON.stringify(
      encodeKeyScope({ groups: { 'shop.orders': { level: 'read' } } }),
    );
    await database
      .connection()
      .query.updateTable('apikey')
      .set({ permissions: v1 })
      .where('id', '=', created.key.id)
      .execute();
    const convert = vi.spyOn(scopes, 'convert').mockImplementation(() => {
      throw new Error('secret detail');
    });
    try {
      const summary = await keys.upgradeLegacyScopes();
      expect(summary).toMatchObject({ converted: 0 });
      expect(summary.failedKeyIds).toContain(created.key.id);
      expect(JSON.stringify(summary)).not.toContain('secret detail');
    } finally {
      convert.mockRestore();
    }
    expect(await storedPermissions(created.key.id)).toBe(v1);
    expect(
      (await app.request('/settings/orders/read', asKey(created.secret)))
        .status,
    ).toBe(200);
    expect(await keys.upgradeLegacyScopes()).toMatchObject({ failed: 0 });
  });

  it('reads a damaged or unknown value as granting nothing', () => {
    expect(decodeKeyPermissions(null)).toBeNull();
    expect(decodeKeyPermissions('{"$v":"9","grants":[]}')).toEqual({
      version: '2',
      permissions: { grants: [] },
      legacy: null,
    });
    expect(
      decodeKeyPermissions({
        $v: '2',
        grants: [
          { resource: orders, actions: [{ action: 'read' }, 7] },
          { resource: { type: 1 }, actions: [{ action: 'x' }] },
          'junk',
        ],
      }),
    ).toEqual({
      version: '2',
      permissions: {
        grants: [{ resource: orders, actions: [{ action: 'read' }] }],
      },
      legacy: null,
    });
  });

  it('never reads a damaged policy or record limit as a missing one', () => {
    const nothing = {
      version: '2',
      permissions: { grants: [] },
      legacy: null,
    };
    const read = { resource: orders, actions: [{ action: 'read' }] };
    // An action whose policy is damaged is refused, not kept without its record scopes.
    expect(
      decodeKeyPermissions({
        $v: '2',
        grants: [
          {
            resource: orders,
            actions: [
              { action: 'read', policy: 'recordsIOwn' },
              { action: 'update', policy: { scopes: {} } },
              { action: 'create' },
            ],
          },
        ],
      }),
    ).toEqual({
      ...nothing,
      permissions: {
        grants: [{ resource: orders, actions: [{ action: 'create' }] }],
      },
    });
    // Record limits damaged as a whole: which businesses were limited is lost, so nothing is granted.
    for (const objects of ['o-1', ['o-1'], null, 7])
      expect(
        decodeKeyPermissions({ $v: '2', grants: [read], objects }),
      ).toEqual(nothing);
    expect(decodeKeyPermissions({ $v: '2', grants: { read } })).toEqual(
      nothing,
    );
    // One business's damaged list reaches none of its records; a damaged id is left out.
    expect(
      decodeKeyPermissions({
        $v: '2',
        grants: [read],
        objects: { orders: 'o-1', apps: ['a-1', 7, ''] },
      }),
    ).toEqual({
      ...nothing,
      permissions: { grants: [read], objects: { orders: [], apps: ['a-1'] } },
    });
    // Left out, each means none.
    expect(decodeKeyPermissions({ $v: '2', grants: [read] })).toEqual({
      ...nothing,
      permissions: { grants: [read] },
    });
  });

  it('enforces a damaged record limit as reaching no record', async () => {
    const created = await keys.create(
      personId,
      { name: 'damaged', expiresInDays: 7, permissions: ordersReadUpdate },
      await identity(),
    );
    await database
      .connection()
      .query.updateTable('apikey')
      .set({
        permissions: JSON.stringify({
          $v: '2',
          grants: ordersReadUpdate.grants,
          objects: 'orders',
        }),
      })
      .where('id', '=', created.key.id)
      .execute();
    expect(
      (await app.request('/settings/orders/read', asKey(created.secret)))
        .status,
    ).toBe(403);
  });

  it('offers what the person holds, human-only actions marked, and the templates resolved to it', async () => {
    const grantable = await keys.grantable(personId);
    expect(grantable.unrestricted).toBe(false);
    expect(grantable.grants.map((grant) => grant.resource.id)).not.toContain(
      'billing',
    );
    expect(
      grantable.grants.find((grant) => grant.resource.id === 'accounts'),
    ).toMatchObject({
      actions: [
        { action: 'read', humanOnly: null },
        { action: 'manage', humanOnly: 'Manages people', risk: 'high' },
      ],
    });
    expect(grantable.objectSources).toEqual(['orders']);
    const template = (id: string) =>
      grantable.templates.find((entry) => entry.id === id);
    expect(template('read-only')?.permissions.grants).toEqual([
      { resource: ordersPage, actions: [{ action: 'access' }] },
      { resource: orders, actions: [{ action: 'read' }] },
      { resource: accounts, actions: [{ action: 'read' }] },
    ]);
    // The human-only action the template names is left out.
    expect(template('shop.ci')).toEqual({
      id: 'shop.ci',
      title: 'CI',
      description: null,
      expiresInDays: 30,
      permissions: {
        grants: [
          {
            resource: orders,
            actions: [{ action: 'read' }, { action: 'update' }],
          },
        ],
        objects: { orders: [] },
      },
      pick: ['orders'],
    });
    expect(template('orders-writer')?.permissions.grants).toContainEqual({
      resource: orders,
      actions: [{ action: 'read' }, { action: 'update' }],
    });
  });

  it('makes the same permissions from a template in code as the editor starts with', async () => {
    const permissions = await keys.templatePermissions(
      'shop.ci',
      await identity(),
      { orders: ['o-1'] },
    );
    expect(permissions).toEqual({
      grants: [
        {
          resource: orders,
          actions: [{ action: 'read' }, { action: 'update' }],
        },
      ],
      objects: { orders: ['o-1'] },
    });
    const created = await keys.create(
      personId,
      { name: 'from-template', expiresInDays: 30, permissions },
      await identity(),
    );
    expect(created.key.permissions).toEqual(permissions);
    await expect(
      keys.templatePermissions('nope', await identity()),
    ).rejects.toMatchObject({ status: 404, code: 'UNKNOWN_TEMPLATE' });
  });

  it('serves permissions and what may be granted at /apiKeys', async () => {
    const services = new Map<unknown, unknown>([
      [authenticationToken, auth],
      [scopedApiKeysToken, keys],
    ]);
    const router = await apiRoutes.createRouter({
      container: {
        has: (token: unknown) => services.has(token),
        resolve: (token: unknown) => services.get(token),
      },
    } as unknown as AppPluginApplication);
    const call = (path: string, method = 'GET', body?: unknown) =>
      router.request(`/apiKeys${path}`, {
        method,
        headers: {
          cookie,
          origin: 'http://localhost',
          'content-type': 'application/json',
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    const grantable = await call('/grantable');
    expect(grantable.status).toBe(200);
    expect(await grantable.json()).toMatchObject({
      data: { mayCreate: true, objectSources: ['orders'] },
    });
    const created = await call('', 'POST', {
      name: 'route',
      expiresInDays: 7,
      permissions: ordersReadUpdate,
    });
    expect(created.status).toBe(201);
    expect(await created.json()).toMatchObject({
      data: { key: { permissions: ordersReadUpdate, scope: { groups: {} } } },
    });
    const humanOnly = await call('', 'POST', {
      name: 'route',
      expiresInDays: 7,
      permissions: {
        grants: [{ resource: accounts, actions: [{ action: 'manage' }] }],
      },
    });
    expect(humanOnly.status).toBe(400);
    expect(await humanOnly.json()).toMatchObject({
      error: { reason: 'KEY_ACTION_HUMAN_ONLY', domain: 'apiKeys' },
    });
    const exceeds = await call('', 'POST', {
      name: 'route',
      expiresInDays: 7,
      permissions: {
        grants: [{ resource: billing, actions: [{ action: 'read' }] }],
      },
    });
    expect(exceeds.status).toBe(403);
    expect(await exceeds.json()).toMatchObject({
      error: { reason: 'KEY_SCOPE_EXCEEDS_YOURS' },
    });
    // The deprecated shape keeps working.
    const old = await call('', 'POST', {
      name: 'old',
      expiresInDays: 7,
      scope: { groups: { 'shop.orders': { level: 'read' } } },
    });
    expect(old.status).toBe(201);
    expect((await call('/scopeOptions')).status).toBe(200);
  });
});
