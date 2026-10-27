// @vitest-environment node

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  Auth,
  createUserAdministrationService,
  type AuthEnv,
  type UserAdministrationService,
} from '@nocobase/app-plugin-authentication/server';
import {
  createAuthorization,
  grantBacked,
  ResourceItems,
  type Authorization,
  type AuthorizationEnv,
  type AuthorizationGrantService,
} from '@nocobase/authorization/core';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { createMigrator, type DatabaseManager } from '@nocobase/db';
import { Hono } from 'hono';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { authenticationToken } from '@nocobase/app-plugin-authentication/server';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';

import { apiKey } from '../server/api-keys.js';
import { requireSignInSession } from '../server/key-sessions.js';
import { apiRoutes } from '../server/routes/index.js';
import { scopedApiKeysToken } from '../server/tokens.js';
import { connectOwnKeyPolicy, ScopedApiKeys } from '../server/scoped-keys.js';
import { createApiKeyScopes, type ApiKeyScopes } from '../server/scopes.js';
import {
  decodeKeyScope,
  encodeKeyScope,
  type KeyScopeGroupDeclaration,
} from '../shared/scopes.js';

const require = createRequire(import.meta.url);
const BASE_URL = 'http://localhost/api/auth';

const appsGroup: KeyScopeGroupDeclaration = {
  id: 'shop.orders',
  category: 'business',
  title: 'Orders',
  levels: {
    read: [
      { kind: 'page', id: 'orders' },
      { kind: 'settings', id: 'orders', action: 'read' },
    ],
    write: [{ kind: 'settings', id: 'orders', action: 'update' }],
    admin: [{ kind: 'settings', id: 'orders', action: 'create' }],
  },
  objects: {
    business: 'shop.orders',
    title: 'Orders',
    allowsUnscoped: [{ kind: 'settings', id: 'orders', action: 'create' }],
  },
};

const billingGroup: KeyScopeGroupDeclaration = {
  id: 'shop.billing',
  category: 'administration',
  title: 'Billing',
  levels: { read: [{ kind: 'settings', id: 'billing', action: 'read' }] },
};

/** Everyone holds every orders and billing capability: the scope is what narrows. */
function grantEverything(): AuthorizationGrantService {
  const grants = [
    ...['read', 'update', 'create'].map((action) => ({
      resource: { type: 'settings', id: 'orders' },
      action,
    })),
    { resource: { type: 'settings', id: 'billing' }, action: 'read' },
    { resource: { type: 'page', id: 'orders' }, action: 'access' },
  ].map((grant) => ({ ...grant, source: { plugin: 'test', id: 'all' } }));
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

function authenticationMigrations(): string {
  return path.join(
    path.dirname(
      require.resolve('@nocobase/app-plugin-authentication/package.json'),
    ),
    'database/migrations',
  );
}

describe('scoped API keys', () => {
  let testDatabase: TestDatabase;
  let database: DatabaseManager;
  let auth: Auth;
  let authz: Authorization;
  let scopes: ApiKeyScopes;
  let keys: ScopedApiKeys;
  let users: UserAdministrationService;
  let personId = '';
  let app: Hono;

  beforeAll(async () => {
    testDatabase = await createTestDatabase();
    database = testDatabase.database;
    for (const [packageName, directory] of [
      ['@nocobase/app-plugin-authentication', authenticationMigrations()],
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
        password: 'password-at-least-8',
      })
    ).id;

    authz = createAuthorization({
      plugins: [
        {
          id: 'test',
          grants: grantEverything(),
          setup(setup) {
            const settings = new ResourceItems();
            settings.add({
              id: 'orders',
              title: 'Orders',
              actions: ['read', 'update', 'create'],
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
    scopes = createApiKeyScopes();
    scopes.groups.add(appsGroup, {
      list: ({ ids }) =>
        Promise.resolve(
          [
            { id: 'o-1', title: 'Order 1' },
            { id: 'o-2', title: 'Order 2' },
          ].filter((item) => !ids || ids.includes(item.id)),
        ),
    });
    scopes.groups.add(billingGroup);
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
      const scope = await keys.resolve(session, request.http.req.raw);
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
      '/orders/:action',
      auth.required({ scopedKeys: true }),
      authz.middleware(),
      async (context) => {
        const allowed = await context.get('authz').can({
          resource: { type: 'settings', id: 'orders' },
          action: context.req.param('action'),
        });
        return context.json(
          {
            allowed,
            objects: context
              .get('authz')
              .identity.keyScope?.objects('shop.orders'),
          },
          allowed ? 200 : 403,
        );
      },
    );
    app = routes as unknown as Hono;
  });

  afterAll(async () => {
    await testDatabase.destroy();
  });

  const as = (secret: string) => ({ headers: { 'x-api-key': secret } });

  it('stores a scope in the permissions column and reads it back', async () => {
    const encoded = encodeKeyScope({
      groups: { 'shop.orders': { level: 'write', objects: ['o-1'] } },
    });
    expect(encoded).toEqual({
      $v: ['1'],
      'shop.orders': ['read', 'write'],
      'shop.orders@': ['o-1'],
    });
    expect(decodeKeyScope(JSON.stringify(encoded))).toEqual({
      groups: { 'shop.orders': { level: 'write', objects: ['o-1'] } },
    });
    expect(decodeKeyScope(null)).toBeNull();
    // An unknown format grants nothing rather than everything.
    expect(decodeKeyScope({ 'shop.orders': ['read'] })).toEqual({ groups: {} });
  });

  it('refuses a scope it cannot honour', async () => {
    const identity = await keys.identityOf(personId);
    for (const [scope, code] of [
      [{ groups: {} }, 'EMPTY_SCOPE'],
      [{ groups: { nope: { level: 'read' } } }, 'UNKNOWN_SCOPE_GROUP'],
      [
        { groups: { 'shop.billing': { level: 'write' } } },
        'SCOPE_LEVEL_NOT_OFFERED',
      ],
      [
        { groups: { 'shop.billing': { level: 'read', objects: ['x'] } } },
        'SCOPE_OBJECTS_NOT_OFFERED',
      ],
      [
        { groups: { 'shop.orders': { level: 'read', objects: ['o-9'] } } },
        'UNKNOWN_SCOPE_OBJECT',
      ],
    ] as const)
      await expect(
        keys.create(
          personId,
          { name: 'bad', expiresInDays: 30, scope },
          identity,
        ),
      ).rejects.toMatchObject({ code });
  });

  it('lets a group be limited to no records, which reaches none of them', async () => {
    const created = await keys.create(
      personId,
      {
        name: 'Nothing yet',
        expiresInDays: 30,
        scope: { groups: { 'shop.orders': { level: 'read', objects: [] } } },
      },
      await keys.identityOf(personId),
    );
    expect(created.key.scope).toEqual({
      groups: { 'shop.orders': { level: 'read', objects: [] } },
    });
    const read = await app.request('/orders/read', as(created.secret));
    expect(await read.json()).toEqual({ allowed: true, objects: [] });
  });

  it('cannot exceed its scope, and is refused where a route does not opt in', async () => {
    const created = await keys.create(
      personId,
      {
        name: 'CI',
        expiresInDays: 90,
        scope: {
          groups: { 'shop.orders': { level: 'write', objects: ['o-1'] } },
        },
      },
      await keys.identityOf(personId),
    );
    expect(created.key).toMatchObject({
      name: 'CI',
      scope: {
        groups: { 'shop.orders': { level: 'write', objects: ['o-1'] } },
      },
    });
    expect(created.key.expiresAt).not.toBeNull();

    const read = await app.request('/orders/read', as(created.secret));
    expect(read.status).toBe(200);
    expect(await read.json()).toEqual({ allowed: true, objects: ['o-1'] });
    expect(
      (await app.request('/orders/update', as(created.secret))).status,
    ).toBe(200);
    // `create` belongs to the admin level, and only with every record in scope.
    expect(
      (await app.request('/orders/create', as(created.secret))).status,
    ).toBe(403);
    const plain = await app.request('/plain', as(created.secret));
    expect(plain.status).toBe(403);
    expect(await plain.json()).toMatchObject({
      error: { reason: 'SCOPED_KEY_FORBIDDEN', domain: 'authentication' },
    });

    const listed = await keys.list(personId);
    expect(listed.find((key) => key.id === created.key.id)?.lastUsedAt).toEqual(
      expect.any(String),
    );
  });

  it('keeps an admin level that needs every record out of a key limited to some', async () => {
    const identity = await keys.identityOf(personId);
    const some = await keys.create(
      personId,
      {
        name: 'some',
        expiresInDays: 7,
        scope: {
          groups: { 'shop.orders': { level: 'admin', objects: ['o-2'] } },
        },
      },
      identity,
    );
    const all = await keys.create(
      personId,
      {
        name: 'all',
        expiresInDays: 7,
        scope: { groups: { 'shop.orders': { level: 'admin' } } },
      },
      identity,
    );
    expect((await app.request('/orders/create', as(some.secret))).status).toBe(
      403,
    );
    expect((await app.request('/orders/create', as(all.secret))).status).toBe(
      200,
    );
  });

  it('refuses account endpoints to a scoped key but answers get-session', async () => {
    const created = await keys.create(
      personId,
      {
        name: 'account',
        expiresInDays: 7,
        scope: { groups: { 'shop.billing': { level: 'read' } } },
      },
      await keys.identityOf(personId),
    );
    const session = await auth.handler(
      new Request(`${BASE_URL}/get-session`, as(created.secret)),
    );
    expect(session.status).toBe(200);
    for (const [path, body] of [
      ['/api-key/create', { name: 'minted' }],
      ['/update-user', { name: 'Mallory' }],
      ['/sign-out', {}],
    ] as const) {
      const response = await auth.handler(
        new Request(`${BASE_URL}${path}`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': created.secret,
          },
          body: JSON.stringify(body),
        }),
      );
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({
        code: path.startsWith('/api-key/')
          ? 'API_KEY_SESSION_FORBIDDEN'
          : 'SCOPED_KEY_FORBIDDEN',
      });
    }
    const listSessions = await auth.handler(
      new Request(`${BASE_URL}/list-sessions`, as(created.secret)),
    );
    expect(listSessions.status).toBe(403);
  });

  it('rotates a key in place: the same id, name, scope and owner with a new secret; and revokes it', async () => {
    const identity = await keys.identityOf(personId);
    const created = await keys.create(
      personId,
      {
        name: 'rotating',
        description: 'nightly',
        expiresInDays: 30,
        scope: { groups: { 'shop.billing': { level: 'read' } } },
      },
      identity,
    );
    const rotated = await keys.rotate(personId, created.key.id);
    expect(rotated.secret).not.toBe(created.secret);
    expect(rotated.key).toMatchObject({
      id: created.key.id,
      name: 'rotating',
      description: 'nightly',
      scope: created.key.scope,
    });
    // The lifetime is renewed, not shortened or lost.
    const days = (view: { createdAt: string; expiresAt: string | null }) =>
      Math.round(
        (Date.parse(view.expiresAt!) - Date.parse(view.createdAt)) / 86_400_000,
      );
    expect(days(rotated.key)).toBe(30);
    // No second key was left behind.
    expect(
      (await keys.list(personId)).filter((key) => key.name === 'rotating'),
    ).toHaveLength(1);
    expect((await app.request('/plain', as(created.secret))).status).toBe(401);
    expect((await app.request('/orders/read', as(rotated.secret))).status).toBe(
      403,
    );
    await keys.revoke(personId, rotated.key.id);
    expect((await app.request('/plain', as(rotated.secret))).status).toBe(401);
    await expect(
      keys.revoke('someone-else', created.key.id),
    ).rejects.toMatchObject({
      code: 'KEY_NOT_FOUND',
    });
  });

  it('keeps a service account’s key working, under the same id, through a rotation', async () => {
    const service = await users.createServiceAccount({ name: 'Deployer' });
    const created = await keys.create(
      service.id,
      {
        name: 'deployer',
        expiresInDays: 7,
        scope: { groups: { 'shop.orders': { level: 'read' } } },
      },
      await keys.identityOf(personId),
    );
    const rotated = await keys.rotate(service.id, created.key.id);
    expect(rotated.key.id).toBe(created.key.id);
    expect((await app.request('/orders/read', as(created.secret))).status).toBe(
      401,
    );
    const response = await app.request('/orders/read', as(rotated.secret));
    expect(response.status).toBe(200);
    // The key is still the service account's.
    const session = await auth.getSession(
      new Headers({ 'x-api-key': rotated.secret }),
    );
    expect(session?.user.id).toBe(service.id);
  });

  it('changes a key’s scope, name and description in place', async () => {
    const created = await keys.create(
      personId,
      {
        name: 'editable',
        expiresInDays: 7,
        scope: { groups: { 'shop.billing': { level: 'read' } } },
      },
      await keys.identityOf(personId),
    );
    expect((await app.request('/orders/read', as(created.secret))).status).toBe(
      403,
    );
    const changed = await keys.setScope(
      personId,
      created.key.id,
      { groups: { 'shop.orders': { level: 'read', objects: ['o-2'] } } },
      await keys.identityOf(personId),
    );
    expect(changed.scope).toEqual({
      groups: { 'shop.orders': { level: 'read', objects: ['o-2'] } },
    });
    const allowed = await app.request('/orders/read', as(created.secret));
    expect(await allowed.json()).toEqual({ allowed: true, objects: ['o-2'] });
    await expect(
      keys.setScope(
        personId,
        created.key.id,
        { groups: { 'shop.orders': { level: 'read', objects: ['o-9'] } } },
        await keys.identityOf(personId),
      ),
    ).rejects.toMatchObject({ code: 'UNKNOWN_SCOPE_OBJECT' });
    const renamed = await keys.update(personId, created.key.id, {
      name: 'renamed',
      description: 'now described',
    });
    expect(renamed).toMatchObject({
      id: created.key.id,
      name: 'renamed',
      description: 'now described',
    });
    const full = await keys.create(
      personId,
      { name: 'full', expiresInDays: 7, scope: null },
      await keys.identityOf(personId),
    );
    await expect(
      keys.setScope(
        personId,
        full.key.id,
        { groups: { 'shop.billing': { level: 'read' } } },
        await keys.identityOf(personId),
      ),
    ).rejects.toMatchObject({ code: 'KEY_NOT_SCOPED' });
  });

  it('bounds a service account’s unscoped key by its holder and stops it once the account is disabled', async () => {
    const robot = await users.createServiceAccount({ name: 'Robot' });
    const created = await keys.create(
      robot.id,
      { name: 'robot', expiresInDays: null, scope: null },
      await keys.identityOf(personId),
    );
    const allowed = await app.request('/orders/create', as(created.secret));
    expect(allowed.status).toBe(200);
    expect(await allowed.json()).toEqual({ allowed: true, objects: 'all' });
    // A service account is never a person: people-only routes refuse even its unscoped key.
    expect((await app.request('/plain', as(created.secret))).status).toBe(403);
    const profile = await auth.handler(
      new Request(`${BASE_URL}/update-user`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': created.secret,
        },
        body: JSON.stringify({ name: 'Renamed' }),
      }),
    );
    expect(profile.status).toBe(403);

    await users.disable(robot.id);
    expect((await app.request('/orders/read', as(created.secret))).status).toBe(
      401,
    );
  });

  it('enforces the configured longest life of a scoped key', async () => {
    const strict = new ScopedApiKeys({
      auth,
      connection: () => database.connection(),
      scopes,
      authorization: () => authz,
      config: () => ({ maxScopedKeyDays: 30 }),
    });
    const identity = await strict.identityOf(personId);
    const scope = { groups: { 'shop.billing': { level: 'read' } } };
    await expect(
      strict.create(
        personId,
        { name: 'x', expiresInDays: null, scope },
        identity,
      ),
    ).rejects.toMatchObject({ code: 'EXPIRY_REQUIRED' });
    await expect(
      strict.create(
        personId,
        { name: 'x', expiresInDays: 31, scope },
        identity,
      ),
    ).rejects.toMatchObject({ code: 'INVALID_EXPIRY' });
    // A key without a scope is its owner and keeps "never".
    await expect(
      strict.create(
        personId,
        { name: 'x', expiresInDays: null, scope: null },
        identity,
      ),
    ).resolves.toMatchObject({ key: { expiresAt: null, scope: null } });
    const options = await strict.scopeOptions(personId);
    expect(options).toMatchObject({
      maxScopedKeyDays: 30,
      defaultExpiresInDays: 30,
    });
    expect(options.groups.map((group) => [group.id, group.held])).toEqual([
      ['shop.orders', { read: true, write: true, admin: true }],
      ['shop.billing', { read: true }],
    ]);
  });

  it('lets no key manage keys through the application’s routes, only a sign-in', async () => {
    const created = await keys.create(
      personId,
      { name: 'full', expiresInDays: 7, scope: null },
      await keys.identityOf(personId),
    );
    const router = new Hono<{ Variables: AuthEnv['Variables'] }>();
    router.post('/keys', auth.required(), requireSignInSession(), (context) =>
      context.json({ ok: true }),
    );
    const refused = await router.request('/keys', {
      method: 'POST',
      ...as(created.secret),
    });
    expect(refused.status).toBe(403);
    expect(await refused.json()).toMatchObject({
      error: { reason: 'API_KEY_SESSION_FORBIDDEN', domain: 'apiKeys' },
    });

    const signIn = await auth.handler(
      new Request(`${BASE_URL}/sign-in/email`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost',
        },
        body: JSON.stringify({
          email: 'ada@example.com',
          password: 'password-at-least-8',
        }),
      }),
    );
    const cookie = signIn.headers
      .getSetCookie()
      .map((header) => header.split(';')[0])
      .join('; ');
    const allowed = await router.request('/keys', {
      method: 'POST',
      headers: { cookie, origin: 'http://localhost' },
    });
    expect(allowed.status).toBe(200);
  });

  it('lets the application say who may create keys of their own, on Better Auth’s endpoint too', async () => {
    const disconnect = await connectOwnKeyPolicy(auth, keys);
    const release = keys.setOwnKeyPolicy((userId) =>
      Promise.resolve(userId !== personId),
    );
    try {
      expect(await keys.mayCreateOwn(personId)).toBe(false);
      await expect(keys.requireOwnCreation(personId)).rejects.toMatchObject({
        status: 403,
        code: 'API_KEY_CREATION_FORBIDDEN',
      });
      const signIn = await auth.handler(
        new Request(`${BASE_URL}/sign-in/email`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            origin: 'http://localhost',
          },
          body: JSON.stringify({
            email: 'ada@example.com',
            password: 'password-at-least-8',
          }),
        }),
      );
      const cookie = signIn.headers
        .getSetCookie()
        .map((header) => header.split(';')[0])
        .join('; ');
      const create = () =>
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
      const refused = await create();
      expect(refused.status).toBe(403);
      expect(await refused.json()).toMatchObject({
        code: 'API_KEY_CREATION_FORBIDDEN',
      });
      // The server still issues keys for whoever it is told (an organization's key, say).
      await expect(
        keys.create(
          personId,
          { name: 'server-issued', expiresInDays: 7, scope: null },
          await keys.identityOf(personId),
        ),
      ).resolves.toMatchObject({ key: { name: 'server-issued' } });
      release();
      expect((await create()).status).toBe(200);
    } finally {
      release();
      disconnect();
    }
  });

  it('serves a person’s own keys at /apiKeys in the standard shapes', async () => {
    const services = new Map<unknown, unknown>([
      [authenticationToken, auth],
      [scopedApiKeysToken, keys],
    ]);
    const container = {
      has: (token: unknown) => services.has(token),
      resolve: (token: unknown) => services.get(token),
    };
    const router = await apiRoutes.createRouter({
      container,
    } as unknown as AppPluginApplication);
    const signIn = await auth.handler(
      new Request(`${BASE_URL}/sign-in/email`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost',
        },
        body: JSON.stringify({
          email: 'ada@example.com',
          password: 'password-at-least-8',
        }),
      }),
    );
    const cookie = signIn.headers
      .getSetCookie()
      .map((header) => header.split(';')[0])
      .join('; ');
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

    const options = await call('/scopeOptions');
    expect(options.status).toBe(200);
    expect(await options.json()).toMatchObject({ data: { mayCreate: true } });

    const objects = await call('/scopeObjects/shop.orders?id=o-2');
    expect(await objects.json()).toEqual({
      data: [{ id: 'o-2', title: 'Order 2' }],
      meta: { total: 1 },
    });
    const unknownGroup = await call('/scopeObjects/shop.billing');
    expect(unknownGroup.status).toBe(404);
    expect(await unknownGroup.json()).toMatchObject({
      error: { reason: 'UNKNOWN_SCOPE_GROUP', domain: 'apiKeys' },
    });

    const created = await call('', 'POST', {
      name: 'route',
      expiresInDays: 7,
      scope: { groups: { 'shop.orders': { level: 'read' } } },
    });
    expect(created.status).toBe(201);
    const { data } = (await created.json()) as {
      data: { key: { id: string }; secret: string };
    };
    expect(data.secret).toEqual(expect.any(String));

    const unknownField = await call('', 'POST', {
      name: 'route',
      expiresInDays: 7,
      scope: null,
      owner: 'someone',
    });
    expect(unknownField.status).toBe(400);
    expect(await unknownField.json()).toMatchObject({
      error: {
        reason: 'INVALID_INPUT',
        fieldViolations: [expect.objectContaining({ field: '' })],
      },
    });
    const badScope = await call('', 'POST', {
      name: 'route',
      expiresInDays: 7,
      scope: { groups: {} },
    });
    expect(badScope.status).toBe(400);
    expect(await badScope.json()).toMatchObject({
      error: { reason: 'EMPTY_SCOPE', domain: 'apiKeys' },
    });

    const listed = (await (await call('')).json()) as {
      data: { id: string }[];
      meta: { total: number };
    };
    expect(listed.meta.total).toBe(listed.data.length);
    expect(listed.data.map((key) => key.id)).toContain(data.key.id);

    expect((await call(`/${data.key.id}/rotate`, 'POST')).status).toBe(200);
    expect((await call(`/${data.key.id}`, 'DELETE')).status).toBe(204);
    const gone = await call(`/${data.key.id}`, 'DELETE');
    expect(gone.status).toBe(404);
    expect(await gone.json()).toMatchObject({
      error: { reason: 'KEY_NOT_FOUND', domain: 'apiKeys' },
    });
  });
});
