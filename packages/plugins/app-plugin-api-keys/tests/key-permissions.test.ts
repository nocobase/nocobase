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
  defineCompositeResource,
  grantBacked,
  ResourceItems,
  type Authorization,
  type AuthorizationEnv,
  type AuthorizationGrantService,
} from '@nocobase/authorization/core';
import { createMigrator, type DatabaseManager } from '@nocobase/db';
import { Hono } from 'hono';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { authorizationToken } from '@nocobase/app-plugin-authorization';

import { apiKey } from '../server/api-keys.js';
import { apiRoutes } from '../server/routes/index.js';
import { connectOwnKeyPolicy, ScopedApiKeys } from '../server/scoped-keys.js';
import { createApiKeyScopes, type ApiKeyScopes } from '../server/scopes.js';
import { scopedApiKeysToken } from '../server/tokens.js';
import {
  decodeKeyPermissions,
  encodeKeyScope,
  type KeyPermissions,
} from '../shared/scopes.js';

/** The whole catalogue the authorization plugin would build: what the person holds, and what they do not. */
const CATALOGUE = {
  sections: [
    {
      name: 'business',
      title: 'Business',
      order: 0,
      subsections: [
        {
          name: 'shop',
          title: 'Shop',
          resources: [
            {
              type: 'settings',
              id: 'orders',
              title: 'Orders',
              group: 'shop',
              actions: [
                { name: 'read', title: 'Read' },
                { name: 'update', title: 'Update' },
              ],
            },
            {
              type: 'composite',
              id: 'shop.payroll',
              title: 'Payroll',
              group: 'finance',
              actions: [{ name: 'view', title: 'View' }],
              dataScopes: {
                view: [
                  {
                    key: 'payslip',
                    title: 'Payslips',
                    collection: 'payroll',
                    fields: [],
                    recordAccess: ['secretAccess'],
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
  resourceGroups: [
    { name: 'shop', title: 'Shop' },
    { name: 'finance', title: 'Finance' },
  ],
  subjectTypes: [
    { type: 'user', title: 'Users', selection: { type: 'collection' } },
  ],
  recordAccess: [
    { key: 'secretAccess', title: 'Secret', collections: ['payroll'] },
  ],
  collections: [{ name: 'payroll', title: 'Payroll', fields: ['salary'] }],
};

vi.mock('@nocobase/app-plugin-authorization', async (actual) => ({
  ...(await actual<typeof import('@nocobase/app-plugin-authorization')>()),
  authorizationOptions: () => Promise.resolve(CATALOGUE),
}));

const require = createRequire(import.meta.url);
const BASE_URL = 'http://localhost/api/auth';
const PASSWORD = 'password-at-least-8';

const orders = { type: 'settings', id: 'orders' } as const;
const accounts = { type: 'settings', id: 'accounts' } as const;
const billing = { type: 'settings', id: 'billing' } as const;
const ordersPage = { type: 'page', id: 'orders' } as const;
const quotes = { type: 'composite', id: 'shop.quotes' } as const;
const everyQuote = { type: 'composite', scopes: { quote: { type: 'all' } } };
const invoices = { type: 'composite', id: 'shop.invoices' } as const;
/** A parameterized record access a role may give an invoice scope. */
const ownInvoices = {
  type: 'recordAccess',
  key: 'ownedBy',
  params: { field: 'ownerId' },
};

/** Grants a test takes away from the person, as `<resource id>/<action>`, and gives back afterwards. */
const revoked = new Set<string>();
/** The record scopes the person's role gives Quotes › View; a test changes it and puts it back. */
let quoteScopes: Record<string, unknown> | undefined = {
  quote: { type: 'all' },
};

/** The person holds orders, accounts and the orders page, never billing. */
function personGrants(): AuthorizationGrantService {
  const all = [
    ...['read', 'update', 'create'].map((action) => ({
      resource: orders,
      action,
    })),
    { resource: accounts, action: 'read' },
    { resource: accounts, action: 'manage' },
    { resource: ordersPage, action: 'access' },
    { resource: invoices, action: 'view' },
    { resource: { type: 'settings', id: 'personalApiKeys' }, action: 'create' },
  ].map((grant) => ({ ...grant, source: { plugin: 'test', id: 'person' } }));
  const grants = () => [
    ...all.filter(
      (grant) => !revoked.has(`${grant.resource.id}/${grant.action}`),
    ),
    {
      resource: quotes,
      action: 'view',
      ...(quoteScopes
        ? { policy: { type: 'composite', scopes: quoteScopes } }
        : {}),
      source: { plugin: 'test', id: 'person' },
    },
  ];
  return {
    resolveAll: () => Promise.resolve(grants()),
    resolve: (input) =>
      Promise.resolve(
        grants().filter(
          (grant) =>
            grant.resource.type === input.resource.type &&
            grant.resource.id === input.resource.id &&
            grant.action === input.action,
        ),
      ),
  };
}

/** The records of every scoped collection here, and those "mine" reaches. */
const RECORDS = ['r1', 'r2', 'r3'];
const MINE = ['r1'];

/** The records a selection reaches among RECORDS; none without one. */
function reach(selection: unknown): string[] {
  if (!selection || typeof selection !== 'object') return [];
  const value = selection as { type?: string; key?: string; ids?: string[] };
  if (value.type === 'all') return RECORDS;
  if (value.type === 'records')
    return RECORDS.filter((id) => value.ids?.includes(id));
  if (value.type === 'recordAccess')
    return value.key === 'allRecords'
      ? RECORDS
      : value.key === 'mine'
        ? MINE
        : [];
  return [];
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
  let settingsItems: ResourceItems;

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
            settingsItems = settings;
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
            setup.resourceTypes.add({
              type: 'database.collection',
              actions: ['read'],
              recordAccess: true,
              // The records a check reaches: what its grants select, cut by every restriction, as the database
              // authorizer does; a grant without a selection reads no record.
              async authorize(request, context) {
                const grants = await context.grants.resolve(request);
                if (!grants.length) return { effect: 'deny', reasons: [] };
                let ids = new Set(
                  grants.flatMap((grant) => reach(grant.origin?.selection)),
                );
                for (const grant of grants)
                  for (const constraint of grant.origin?.constraints ?? [])
                    if (constraint.effect === 'restrict') {
                      const kept = new Set(reach(constraint.selection));
                      ids = new Set([...ids].filter((id) => kept.has(id)));
                    }
                return {
                  effect: 'conditional',
                  conditions: { type: 'ids', ids: [...ids].sort() },
                  reasons: [],
                };
              },
            });
          },
        },
      ],
    });
    authz.compositeResources.define(
      defineCompositeResource('shop.invoices', (resource) =>
        resource.action('view', (action) =>
          action.grant({
            build: () => ({
              // Offers only the parameterized scope by name; every record is core's own selection.
              dataScopes: [
                {
                  key: 'invoice',
                  title: 'Invoices',
                  defaultValue: 'ownedBy',
                  options: ['ownedBy'],
                },
              ],
              grants: [
                {
                  resource: { type: 'database.collection', id: 'invoices' },
                  actions: [{ action: 'read', scopeKey: 'invoice' }],
                },
              ],
            }),
          }),
        ),
      ),
    );
    authz.compositeResources.define(
      defineCompositeResource('shop.quotes', (resource) =>
        resource.action('view', (action) =>
          action.grant({
            build: () => ({
              dataScopes: [{ key: 'quote', title: 'Quotes' }],
              grants: [
                {
                  resource: { type: 'database.collection', id: 'quotes' },
                  actions: [{ action: 'read', scopeKey: 'quote' }],
                },
              ],
            }),
          }),
        ),
      ),
    );
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
      // These keys include ones that act as their owner in full, as an application that turned them on makes.
      config: () => ({ allowSameAsMe: true }),
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
      '/composite/:id/:action',
      auth.required({ scopedKeys: true }),
      authz.middleware(),
      async (context) => {
        const decision = await context.get('authz').authorize({
          resource: { type: 'composite', id: context.req.param('id') },
          action: context.req.param('action'),
        });
        // The records the composite's one branch reaches.
        const checks = (
          decision.conditions as
            | { checks?: { decision: { conditions?: { ids?: string[] } } }[] }
            | undefined
        )?.checks;
        return context.json(
          {
            effect: decision.effect,
            reason: decision.reasons[0]?.code,
            records: checks?.[0]?.decision.conditions?.ids ?? [],
          },
          decision.effect === 'deny' ? 403 : 200,
        );
      },
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
    // A composite policy whose record scopes are damaged is refused too, and so is a policy on anything else.
    for (const policy of [
      { type: 'composite', scopes: null },
      { type: 'composite', scopes: [] },
      { type: 'composite' },
      { type: 'recordsIOwn', scopes: {} },
    ])
      expect(
        decodeKeyPermissions({
          $v: '2',
          grants: [
            { resource: quotes, actions: [{ action: 'view', policy }] },
            read,
          ],
        }),
      ).toEqual({ ...nothing, permissions: { grants: [read] } });
    expect(
      decodeKeyPermissions({
        $v: '2',
        grants: [
          {
            resource: quotes,
            actions: [{ action: 'view', policy: everyQuote }],
          },
        ],
      }).permissions,
    ).toEqual({
      grants: [
        { resource: quotes, actions: [{ action: 'view', policy: everyQuote }] },
      ],
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

  it('refuses a composite action whose stored record scopes are damaged', async () => {
    const created = await keys.create(
      personId,
      {
        name: 'quotes',
        expiresInDays: 7,
        permissions: {
          grants: [
            {
              resource: quotes,
              actions: [{ action: 'view', policy: everyQuote }],
            },
          ],
        },
      },
      await identity(),
    );
    expect(
      (await app.request('/composite/shop.quotes/view', asKey(created.secret)))
        .status,
    ).toBe(200);
    for (const policy of [
      { type: 'composite', scopes: null },
      { type: 'other', scopes: { quote: { type: 'all' } } },
    ]) {
      await database
        .connection()
        .query.updateTable('apikey')
        .set({
          permissions: JSON.stringify({
            $v: '2',
            grants: [
              { resource: quotes, actions: [{ action: 'view', policy }] },
            ],
          }),
        })
        .where('id', '=', created.key.id)
        .execute();
      expect(
        (
          await app.request(
            '/composite/shop.quotes/view',
            asKey(created.secret),
          )
        ).status,
      ).toBe(403);
    }
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
      { resource: invoices, actions: [{ action: 'view' }] },
      { resource: quotes, actions: [{ action: 'view' }] },
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

  /** Signs the person in and calls Better Auth's own `/api-key/create`, which makes a key that is them in full. */
  const createThroughBetterAuth = () =>
    auth.handler(
      new Request(`${BASE_URL}/api-key/create`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost',
          cookie,
        },
        body: JSON.stringify({ name: 'direct' }),
      }),
    );

  it('refuses a key that is its owner in full unless the application turns such keys on', async () => {
    const strict = new ScopedApiKeys({
      auth,
      connection: () => database.connection(),
      scopes,
      authorization: () => authz,
      config: () => ({}),
    });
    // One made while they were on keeps working once they are off.
    const before = await keys.create(
      personId,
      { name: 'same as me', expiresInDays: 7, permissions: null },
      await identity(),
    );
    expect((await strict.rules()).allowSameAsMe).toBe(false);
    for (const input of [
      { name: 'new', expiresInDays: 7, permissions: null },
      // The deprecated shape is refused the same way.
      { name: 'old', expiresInDays: 7, scope: null },
      { name: 'neither', expiresInDays: 7 },
    ])
      await expect(
        strict.create(personId, input, await identity()),
      ).rejects.toMatchObject({ status: 403, code: 'SAME_AS_ME_DISABLED' });
    // A key with permissions is made as before.
    await expect(
      strict.create(
        personId,
        { name: 'scoped', expiresInDays: 7, permissions: ordersReadUpdate },
        await identity(),
      ),
    ).resolves.toMatchObject({ key: { permissions: ordersReadUpdate } });
    expect(
      (await app.request('/settings/orders/read', asKey(before.secret))).status,
    ).toBe(200);
    expect((await strict.grantable(personId)).allowSameAsMe).toBe(false);

    // Better Auth's own endpoint, from a sign-in, is refused too while they are off, and works once they are on.
    let disconnect = await connectOwnKeyPolicy(auth, strict);
    try {
      const refused = await createThroughBetterAuth();
      expect(refused.status).toBe(403);
      expect(await refused.json()).toMatchObject({
        code: 'SAME_AS_ME_DISABLED',
      });
    } finally {
      disconnect();
    }
    disconnect = await connectOwnKeyPolicy(auth, keys);
    try {
      expect((await createThroughBetterAuth()).status).toBe(200);
      await expect(
        keys.create(
          personId,
          { name: 'old', expiresInDays: 7, scope: null },
          await identity(),
        ),
      ).resolves.toMatchObject({ key: { scope: null, permissions: null } });
    } finally {
      disconnect();
    }
  });

  it('lets a person create keys of their own while a role grants settings:personalApiKeys/create, and no longer once the last grant goes', async () => {
    // Not registered, as in an application without the permission: everyone may, as before.
    expect(await keys.mayCreateOwn(personId)).toBe(true);
    settingsItems.add({
      id: 'personalApiKeys',
      title: 'Personal API keys',
      actions: [{ name: 'create', humanOnly: 'Keys never make keys' }],
    });
    // Registered, a role decides: the person's role grants it.
    expect(await keys.mayCreateOwn(personId)).toBe(true);
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
    revoked.add('personalApiKeys/create');
    try {
      // The last grant gone: New key disappears, creating is refused, the keys they have stay theirs to see and revoke.
      const list = (await (await call('')).json()) as {
        data: { id: string }[];
        meta: { mayCreate: boolean };
      };
      expect(list.meta.mayCreate).toBe(false);
      expect(list.data.length).toBeGreaterThan(0);
      const refused = await call('', 'POST', {
        name: 'refused',
        expiresInDays: 7,
        permissions: ordersReadUpdate,
      });
      expect(refused.status).toBe(403);
      expect(await refused.json()).toMatchObject({
        error: { reason: 'API_KEY_CREATION_FORBIDDEN' },
      });
      expect((await call(`/${list.data[0]!.id}`)).status).toBe(200);
      expect((await call(`/${list.data[0]!.id}`, 'DELETE')).status).toBe(204);
      // An application's own policy still decides when it sets one.
      const release = keys.setOwnKeyPolicy(() => Promise.resolve(true));
      try {
        expect(await keys.mayCreateOwn(personId)).toBe(true);
      } finally {
        release();
      }
    } finally {
      revoked.delete('personalApiKeys/create');
    }
    expect(await keys.mayCreateOwn(personId)).toBe(true);
  });

  it('shows the actions a key lost with its owner, and gives them back when the owner holds them again', async () => {
    const created = await keys.create(
      personId,
      { name: 'lapsing', expiresInDays: 7, permissions: ordersReadUpdate },
      await identity(),
    );
    expect(await keys.detail(personId, created.key.id)).toMatchObject({
      lapsed: [],
    });
    revoked.add('orders/update');
    try {
      expect((await keys.detail(personId, created.key.id)).lapsed).toEqual([
        { resource: orders, actions: [{ action: 'update' }] },
      ]);
      expect(
        (await app.request('/settings/orders/update', asKey(created.secret)))
          .status,
      ).toBe(403);
    } finally {
      revoked.delete('orders/update');
    }
    expect((await keys.detail(personId, created.key.id)).lapsed).toEqual([]);
    expect(
      (await app.request('/settings/orders/update', asKey(created.secret)))
        .status,
    ).toBe(200);
  });

  it('never lets a key reach more records of a composite action than its owner’s roles do', async () => {
    const asked: unknown[] = [];
    const sets = (scope: unknown) => ({
      // Only the sets the person holds, asked for them alone.
      getEffective: (input: unknown) => {
        asked.push(input);
        return Promise.resolve([
          {
            key: 'staff',
            grants: [
              {
                resource: quotes,
                actions: [
                  {
                    action: 'view',
                    policy: { type: 'composite', scopes: { quote: scope } },
                  },
                ],
              },
            ],
          },
        ]);
      },
    });
    const withQuotes = (quote: unknown): KeyPermissions => ({
      grants: [
        {
          resource: quotes,
          actions: [
            {
              action: 'view',
              policy: { type: 'composite', scopes: { quote } },
            },
          ],
        },
      ],
    });
    Reflect.set(authz, 'permissionSets', sets('recordsIOwn'));
    try {
      const grantable = await keys.grantable(personId);
      expect(
        grantable.grants
          .find((grant) => grant.resource.id === quotes.id)
          ?.actions.find((action) => action.action === 'view'),
      ).toMatchObject({ scopes: { quote: ['recordsIOwn'] } });
      expect(asked).toContainEqual(
        expect.objectContaining({
          principal: { type: 'user', id: personId },
        }),
      );
      for (const quote of [{ type: 'all' }, { type: 'records', ids: ['q1'] }])
        await expect(
          keys.create(
            personId,
            { name: 'wide', expiresInDays: 7, permissions: withQuotes(quote) },
            await identity(),
          ),
        ).rejects.toMatchObject({
          status: 403,
          code: 'KEY_SCOPE_EXCEEDS_YOURS',
        });
      // Holding every record, any narrower scope may be given.
      Reflect.set(authz, 'permissionSets', sets({ type: 'all' }));
      await expect(
        keys.create(
          personId,
          {
            name: 'picked',
            expiresInDays: 7,
            permissions: withQuotes({ type: 'records', ids: ['q1'] }),
          },
          await identity(),
        ),
      ).resolves.toMatchObject({ key: { name: 'picked' } });
    } finally {
      Reflect.deleteProperty(authz, 'permissionSets');
    }
  });

  it('pins a key to the records its maker holds when it is made, so it does not widen with their roles later', async () => {
    const holding = (quote: unknown) => ({
      getEffective: () =>
        Promise.resolve([
          {
            key: 'staff',
            grants: [
              {
                resource: quotes,
                actions: [
                  {
                    action: 'view',
                    policy: { type: 'composite', scopes: { quote } },
                  },
                ],
              },
            ],
          },
        ]),
    });
    const some = { type: 'records', ids: ['q1'] };
    Reflect.set(authz, 'permissionSets', holding(some));
    try {
      // The default a key starts with names the records the maker holds now.
      const offered = (await keys.grantable(personId)).grants
        .find((grant) => grant.resource.id === quotes.id)
        ?.actions.find((action) => action.action === 'view');
      expect(offered?.policy).toEqual({
        type: 'composite',
        scopes: { quote: some },
      });
      // A key that names no records gets the maker's pinned, not "whatever the maker holds".
      const created = await keys.create(
        personId,
        {
          name: 'pinned',
          expiresInDays: 7,
          permissions: {
            grants: [{ resource: quotes, actions: [{ action: 'view' }] }],
          },
        },
        await identity(),
      );
      const pinned = {
        grants: [
          {
            resource: quotes,
            actions: [
              {
                action: 'view',
                policy: { type: 'composite', scopes: { quote: some } },
              },
            ],
          },
        ],
      };
      expect(created.key.permissions).toEqual(pinned);
      // The maker's role widens to every record; the key stays as it was made.
      Reflect.set(authz, 'permissionSets', holding({ type: 'all' }));
      expect((await keys.get(personId, created.key.id)).permissions).toEqual(
        pinned,
      );
      expect(
        decodeKeyPermissions(await storedPermissions(created.key.id)),
      ).toMatchObject({ permissions: pinned });
    } finally {
      Reflect.deleteProperty(authz, 'permissionSets');
    }
  });

  it('pins a scope a role leaves to its declared default, parameters and all, and pins every record as core’s own selection', async () => {
    const holding = (scopes?: Record<string, unknown>) => ({
      getEffective: () =>
        Promise.resolve([
          {
            key: 'staff',
            grants: [
              {
                resource: invoices,
                actions: [
                  scopes
                    ? {
                        action: 'view',
                        policy: { type: 'composite', scopes },
                      }
                    : { action: 'view' },
                ],
              },
            ],
          },
        ]),
    });
    const viewInvoices = (policy?: unknown): KeyPermissions => ({
      grants: [
        {
          resource: invoices,
          actions: [
            policy === undefined
              ? { action: 'view' }
              : { action: 'view', policy: policy as { type: string } },
          ],
        },
      ],
    });
    // The role names no scope: it holds the action's declared default.
    Reflect.set(authz, 'permissionSets', holding());
    try {
      const byDefault = await keys.create(
        personId,
        { name: 'default', expiresInDays: 7, permissions: viewInvoices() },
        await identity(),
      );
      expect(byDefault.key.permissions).toEqual(
        viewInvoices({ type: 'composite', scopes: { invoice: 'ownedBy' } }),
      );
      // The role gives the scope with parameters: a key is pinned to it, parameters and all.
      Reflect.set(authz, 'permissionSets', holding({ invoice: ownInvoices }));
      const pinned = await keys.create(
        personId,
        { name: 'params', expiresInDays: 7, permissions: viewInvoices() },
        await identity(),
      );
      const asMade = viewInvoices({
        type: 'composite',
        scopes: { invoice: ownInvoices },
      });
      expect(pinned.key.permissions).toEqual(asMade);
      // The same record access with other parameters is not what the role gives, whatever its name.
      await expect(
        keys.create(
          personId,
          {
            name: 'other params',
            expiresInDays: 7,
            permissions: viewInvoices({
              type: 'composite',
              scopes: {
                invoice: { ...ownInvoices, params: { field: 'teamId' } },
              },
            }),
          },
          await identity(),
        ),
      ).rejects.toMatchObject({ status: 403, code: 'KEY_SCOPE_EXCEEDS_YOURS' });
      // The role widens to every record: the key made before stays as it was made.
      Reflect.set(
        authz,
        'permissionSets',
        holding({ invoice: { type: 'all' } }),
      );
      expect((await keys.get(personId, pinned.key.id)).permissions).toEqual(
        asMade,
      );
      expect((await keys.get(personId, byDefault.key.id)).permissions).toEqual(
        viewInvoices({ type: 'composite', scopes: { invoice: 'ownedBy' } }),
      );
      // A key made now is pinned to every record as core's own selection, which the action accepts though it lists
      // no `allRecords`.
      const wide = await keys.create(
        personId,
        { name: 'every record', expiresInDays: 7, permissions: viewInvoices() },
        await identity(),
      );
      expect(wide.key.permissions).toEqual(
        viewInvoices({
          type: 'composite',
          scopes: { invoice: { type: 'all' } },
        }),
      );
    } finally {
      Reflect.deleteProperty(authz, 'permissionSets');
    }
  });

  it('serves a key’s catalogue with what its owner holds and the key lost, and nothing about the rest', async () => {
    const created = await keys.create(
      personId,
      { name: 'catalogue', expiresInDays: 7, permissions: ordersReadUpdate },
      await identity(),
    );
    const services = new Map<unknown, unknown>([
      [authenticationToken, auth],
      [scopedApiKeysToken, keys],
      [authorizationToken, authz],
    ]);
    const router = await apiRoutes.createRouter({
      container: {
        has: (token: unknown) => services.has(token),
        resolve: (token: unknown) => services.get(token),
      },
    } as unknown as AppPluginApplication);
    revoked.add('orders/update');
    try {
      const answer = await router.request(
        `/apiKeys/${created.key.id}/catalog`,
        { headers: { cookie, origin: 'http://localhost' } },
      );
      expect(answer.status).toBe(200);
      const { data } = (await answer.json()) as { data: typeof CATALOGUE };
      // Orders with read, which the person holds, and update, which the key still names after they lost it.
      expect(
        data.sections.flatMap((section) =>
          section.subsections.flatMap((subsection) =>
            subsection.resources.map((resource) => [
              resource.id,
              resource.actions.map((action) => action.name),
            ]),
          ),
        ),
      ).toEqual([['orders', ['read', 'update']]]);
      // Nothing of payroll: its group, its record access and its collection stay out, and nobody's subject types.
      expect(data.resourceGroups).toEqual([{ name: 'shop', title: 'Shop' }]);
      expect(data.recordAccess).toEqual([]);
      expect(data.collections).toEqual([]);
      expect(data.subjectTypes).toEqual([]);
      // Another person's key, or none, is not found.
      expect(
        (
          await router.request('/apiKeys/missing/catalog', {
            headers: { cookie, origin: 'http://localhost' },
          })
        ).status,
      ).toBe(404);
    } finally {
      revoked.delete('orders/update');
    }
  });

  /** The person's role gives Quotes › View with these record scopes, as the grants and the Permission Sets say. */
  const roleGivesQuotes = (scopes: Record<string, unknown> | undefined) => {
    quoteScopes = scopes;
    Reflect.set(authz, 'permissionSets', {
      getEffective: () =>
        Promise.resolve([
          {
            key: 'staff',
            grants: [
              {
                resource: quotes,
                actions: [
                  scopes
                    ? { action: 'view', policy: { type: 'composite', scopes } }
                    : { action: 'view' },
                ],
              },
            ],
          },
        ]),
    });
  };
  const records = async (headers: Record<string, string>) => {
    const answer = await app.request('/composite/shop.quotes/view', {
      headers,
    });
    return ((await answer.json()) as { records: string[] }).records;
  };
  const viewQuotes = (quote?: unknown): KeyPermissions => ({
    grants: [
      {
        resource: quotes,
        actions: [
          quote === undefined
            ? { action: 'view' }
            : {
                action: 'view',
                policy: { type: 'composite', scopes: { quote } },
              },
        ],
      },
    ],
  });

  it('pins a scope a role names nowhere, and the action declares no default for, to no record, and keeps it there', async () => {
    try {
      // The role gives the action without a scope: core selects nothing for it, so the person reads no quote.
      roleGivesQuotes(undefined);
      expect(await records(asPerson().headers)).toEqual([]);
      const created = await keys.create(
        personId,
        { name: 'no scope', expiresInDays: 7, permissions: viewQuotes() },
        await identity(),
      );
      expect(created.key.permissions).toEqual(viewQuotes(''));
      // The role later reaches every quote: the person does, the key made before still reads none.
      roleGivesQuotes({ quote: { type: 'all' } });
      expect(await records(asPerson().headers)).toEqual(['r1', 'r2', 'r3']);
      expect(await records(asKey(created.secret).headers)).toEqual([]);
    } finally {
      roleGivesQuotes({ quote: { type: 'all' } });
      Reflect.deleteProperty(authz, 'permissionSets');
    }
  });

  it('reads the built-in allRecords as every record, so a key may be narrowed to what the action offers', async () => {
    try {
      roleGivesQuotes({ quote: 'allRecords' });
      // Narrowed to the person's own quotes: accepted, and the key reads only those.
      const mine = await keys.create(
        personId,
        { name: 'mine', expiresInDays: 7, permissions: viewQuotes('mine') },
        await identity(),
      );
      expect(await records(asPerson().headers)).toEqual(['r1', 'r2', 'r3']);
      expect(await records(asKey(mine.secret).headers)).toEqual(['r1']);
      // Left out, the scope is pinned to the role's own value, which reaches every quote.
      const all = await keys.create(
        personId,
        { name: 'all', expiresInDays: 7, permissions: viewQuotes() },
        await identity(),
      );
      expect(all.key.permissions).toEqual(viewQuotes('allRecords'));
      expect(await records(asKey(all.secret).headers)).toEqual([
        'r1',
        'r2',
        'r3',
      ]);
    } finally {
      roleGivesQuotes({ quote: { type: 'all' } });
      Reflect.deleteProperty(authz, 'permissionSets');
    }
  });
});
