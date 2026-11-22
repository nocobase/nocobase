// @vitest-environment node
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  Auth,
  authenticationToken,
  createUserAdministrationService,
  type AuthEnv,
  type UserAdministrationService,
} from '@nocobase/app-plugin-authentication/server';
import {
  authorizationToken,
  createAppAuthorization,
  type AppAuthorization,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { createMigrator, type DatabaseManager } from '@nocobase/db';
import { Hono } from 'hono';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { apiKey } from '../server/api-keys.js';
import { IdleKeys, type IdleReminder } from '../server/idle.js';
import { MemberKeys } from '../server/member-keys.js';
import { apiRoutes } from '../server/routes/index.js';
import { ScopedApiKeys } from '../server/scoped-keys.js';
import { createApiKeyScopes } from '../server/scopes.js';
import { registerApiKeySettings } from '../server/settings.js';
import {
  assertSystemPermissions,
  SystemApiKeys,
  releasedKey,
  systemKeySet,
} from '../server/system-keys.js';
import {
  memberApiKeysToken,
  scopedApiKeysToken,
  systemApiKeysToken,
} from '../server/tokens.js';

const require = createRequire(import.meta.url);
const BASE_URL = 'http://localhost/api/auth';
const PASSWORD = 'password-at-least-8';
const DAY = 86_400_000;

const orders = { type: 'settings', id: 'orders' } as const;
const readOrders = {
  grants: [{ resource: orders, actions: [{ action: 'read' }] }],
};

describe('system keys', () => {
  let testDatabase: TestDatabase;
  let database: DatabaseManager;
  let auth: Auth;
  let authz: AppAuthorization;
  let users: UserAdministrationService;
  let keys: ScopedApiKeys;
  let systemKeys: SystemApiKeys;
  let app: Hono;
  let adminId = '';
  let memberId = '';
  let adminCookie = '';
  let memberCookie = '';

  const signIn = async (email: string) =>
    (
      await auth.handler(
        new Request(`${BASE_URL}/sign-in/email`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            origin: 'http://localhost',
          },
          body: JSON.stringify({ email, password: PASSWORD }),
        }),
      )
    ).headers
      .getSetCookie()
      .map((header) => header.split(';')[0])
      .join('; ');

  const call = (path: string, cookie: string, method = 'GET', body?: unknown) =>
    app.request(`/api${path}`, {
      method,
      headers: {
        cookie,
        origin: 'http://localhost',
        'content-type': 'application/json',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  const asKey = (secret: string, path: string) =>
    app.request(path, { headers: { 'x-api-key': secret } });

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
        '@nocobase/app-plugin-authorization',
        path.join(
          path.dirname(
            require.resolve('@nocobase/app-plugin-authorization/package.json'),
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
    adminId = (
      await users.create({
        name: 'Ada Admin',
        email: 'ada@example.com',
        password: PASSWORD,
      })
    ).id;
    memberId = (
      await users.create({
        name: 'Max Member',
        email: 'max@example.com',
        password: PASSWORD,
      })
    ).id;

    authz = createAppAuthorization({ connection: database.connection() });
    authz.settings.add({
      id: 'orders',
      title: 'Orders',
      actions: [{ name: 'read' }, { name: 'update' }],
    });
    registerApiKeySettings(authz);
    // A type without items whose one action is a person's only, as the users plugin registers accounts.
    authz.resourceTypes.add({
      type: 'account',
      actions: [{ name: 'manage', humanOnly: 'People only' }, { name: 'read' }],
    });
    await authz.permissionSets.create({ key: 'root', grants: [] });
    await authz.permissionSets.assign({
      subject: { type: 'user', id: adminId },
      permissionSet: 'root',
    });
    await authz.permissionSets.create({
      key: 'staff',
      grants: [authz.settings.grant('orders', ['read'])],
    });
    await authz.permissionSets.assign({
      subject: { type: 'user', id: memberId },
      permissionSet: 'staff',
    });

    keys = new ScopedApiKeys({
      auth,
      connection: () => database.connection(),
      scopes: createApiKeyScopes(),
      authorization: () => authz,
      config: () => ({}),
    });
    systemKeys = new SystemApiKeys({
      connection: () => database.connection(),
      keys,
      users: () => users,
      authorization: () => authz,
    });
    // As the plugin's provider does at boot, in every process.
    systemKeys.protectAll();
    auth.addScopedCredentialCheck(
      async (session, request) =>
        (await keys.resolve(session, request)) !== null,
    );
    authz.use(async (request, next) => {
      const session: unknown = request.http.get('auth' as never);
      const scope = await keys.credentialScope(
        session as Parameters<typeof keys.resolve>[0],
        request.http.req.raw,
      );
      if (scope) request.keyScope = scope;
      await next();
    });

    const services = new Map<unknown, unknown>([
      [authenticationToken, auth],
      [authorizationToken, authz],
      [scopedApiKeysToken, keys],
      [systemApiKeysToken, systemKeys],
      [
        memberApiKeysToken,
        new MemberKeys({ connection: () => database.connection(), keys }),
      ],
    ]);
    const api = await apiRoutes.createRouter({
      container: {
        has: (token: unknown) => services.has(token),
        resolve: (token: unknown) => services.get(token),
      },
    } as unknown as AppPluginApplication);
    const routes = new Hono<{
      Variables: AuthEnv['Variables'] & AuthorizationEnv['Variables'];
    }>();
    routes.route('/api', api);
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
          {
            effect: decision.effect,
            principal: context.get('authz').identity.principal.id,
          },
          decision.effect === 'permit' ? 200 : 403,
        );
      },
    );
    app = routes as unknown as Hono;
    adminCookie = await signIn('ada@example.com');
    memberCookie = await signIn('max@example.com');
  });

  afterAll(async () => {
    await testDatabase.destroy();
  });

  it('shows someone who holds everything the person-only actions of a type without items, and refuses them to a key', async () => {
    const admin = await keys.grantable(adminId);
    expect(admin.unrestricted).toBe(true);
    expect(
      admin.grants.find((grant) => grant.resource.type === 'account'),
    ).toEqual({
      resource: { type: 'account', id: '*' },
      title: null,
      actions: [
        {
          action: 'manage',
          title: null,
          humanOnly: 'People only',
          risk: null,
        },
      ],
    });
    const member = await keys.grantable(memberId);
    expect(
      member.grants.some((grant) => grant.resource.type === 'account'),
    ).toBe(false);
    await expect(
      systemKeys.create(adminId, {
        name: 'accounts',
        expiresInDays: 30,
        permissions: {
          grants: [
            {
              resource: { type: 'account', id: '*' },
              actions: [{ action: 'manage' }],
            },
          ],
        },
      }),
    ).rejects.toMatchObject({ code: 'KEY_ACTION_HUMAN_ONLY' });
  });

  it('acts as an identity of its own, changes at once with a record of the change, rotates, stops and outlives its owner', async () => {
    const made = await call('/systemApiKeys', adminCookie, 'POST', {
      name: 'ERP sync',
      ownerId: memberId,
      expiresInDays: null,
      permissions: readOrders,
    });
    expect(made.status).toBe(201);
    const { data: created } = (await made.json()) as {
      data: {
        key: { identityId: string; owner: { id: string } };
        secret: string;
      };
    };
    const { identityId } = created.key;
    expect(created.key.owner.id).toBe(memberId);
    // It calls as its own service account, never as a member, and holds a hidden protected set.
    const asSystem = await asKey(created.secret, '/settings/orders/read');
    expect(asSystem.status).toBe(200);
    expect(((await asSystem.json()) as { principal: string }).principal).toBe(
      identityId,
    );
    expect(
      authz.permissionSets.protection(systemKeySet(identityId)),
    ).toMatchObject({
      owner: '@nocobase/app-plugin-api-keys',
      hidden: true,
    });
    expect((await users.list()).items.map((user) => user.id)).not.toContain(
      identityId,
    );
    expect(
      (await asKey(created.secret, '/settings/orders/update')).status,
    ).toBe(403);

    // Its permissions change at once, recorded with who and what before and after.
    const both = {
      grants: [
        {
          resource: orders,
          actions: [{ action: 'read' }, { action: 'update' }],
        },
      ],
    };
    expect(
      (
        await call(
          `/systemApiKeys/${identityId}/permissions`,
          adminCookie,
          'PUT',
          {
            permissions: both,
          },
        )
      ).status,
    ).toBe(200);
    expect(
      (await asKey(created.secret, '/settings/orders/update')).status,
    ).toBe(200);
    const events = (
      (await (
        await call(`/systemApiKeys/${identityId}/events`, adminCookie)
      ).json()) as {
        data: {
          action: string;
          actor: { id: string } | null;
          details: unknown;
        }[];
      }
    ).data;
    expect(events[0]).toMatchObject({
      action: 'permissions',
      actor: { id: adminId },
      details: { before: readOrders, after: both },
    });
    expect(events.at(-1)).toMatchObject({ action: 'create' });

    // Rotated, the old value stops at once and the identity and permissions stay.
    const rotated = (
      (await (
        await call(`/systemApiKeys/${identityId}/rotate`, adminCookie, 'POST')
      ).json()) as { data: { secret: string; key: { identityId: string } } }
    ).data;
    expect(rotated.key.identityId).toBe(identityId);
    expect((await asKey(created.secret, '/settings/orders/read')).status).toBe(
      401,
    );
    expect(
      (await asKey(rotated.secret, '/settings/orders/update')).status,
    ).toBe(200);

    // Its owner disabled, it goes on; disabled itself, it stops at once.
    await users.disable(memberId);
    try {
      expect(
        (await asKey(rotated.secret, '/settings/orders/read')).status,
      ).toBe(200);
    } finally {
      await users.enable(memberId);
    }
    expect(
      (await call(`/systemApiKeys/${identityId}/disable`, adminCookie, 'POST'))
        .status,
    ).toBe(200);
    expect((await asKey(rotated.secret, '/settings/orders/read')).status).toBe(
      401,
    );
    expect(
      (await call(`/systemApiKeys/${identityId}/enable`, adminCookie, 'POST'))
        .status,
    ).toBe(200);
    expect((await asKey(rotated.secret, '/settings/orders/read')).status).toBe(
      200,
    );

    // Deleted, its key, account and set go; the activity stays.
    expect(
      (await call(`/systemApiKeys/${identityId}`, adminCookie, 'DELETE'))
        .status,
    ).toBe(204);
    expect((await asKey(rotated.secret, '/settings/orders/read')).status).toBe(
      401,
    );
    expect(
      await authz.permissionSets.get(systemKeySet(identityId)),
    ).toBeUndefined();
    expect(
      (await systemKeys.events(identityId).catch(() => 'gone')) as unknown,
    ).toBe('gone');
  });

  it('opens to settings:apiKeys read, and changes only with manage', async () => {
    // Disabling the member above ended their session.
    memberCookie = await signIn('max@example.com');
    expect((await call('/systemApiKeys', memberCookie)).status).toBe(403);
    expect((await call('/apiKeys/members', memberCookie)).status).toBe(403);
    await authz.permissionSets.update('staff', {
      key: 'staff',
      grants: [
        authz.settings.grant('orders', ['read']),
        authz.settings.grant('apiKeys', ['read']),
      ],
    });
    try {
      expect((await call('/systemApiKeys', memberCookie)).status).toBe(200);
      expect(
        (
          await call('/systemApiKeys', memberCookie, 'POST', {
            name: 'x',
            expiresInDays: 7,
            permissions: readOrders,
          })
        ).status,
      ).toBe(403);
    } finally {
      await authz.permissionSets.update('staff', {
        key: 'staff',
        grants: [authz.settings.grant('orders', ['read'])],
      });
    }
  });

  it('protects a key’s hidden set in another process sharing the database, created after that process started', async () => {
    // Another instance of the application, booted before the key exists.
    const other = createAppAuthorization({ connection: database.connection() });
    const otherKeys = new SystemApiKeys({
      connection: () => database.connection(),
      keys,
      users: () => users,
      authorization: () => other,
    });
    otherKeys.protectAll();
    const created = await systemKeys.create(adminId, {
      name: 'elsewhere',
      expiresInDays: 30,
      permissions: readOrders,
    });
    const set = systemKeySet(created.key.identityId);
    expect(other.permissionSets.protection(set)).toMatchObject({
      owner: '@nocobase/app-plugin-api-keys',
      hidden: true,
      allow: [],
    });
    expect(() => other.permissionSets.assertWritable(set, 'update')).toThrow();
    expect(() => other.permissionSets.assertWritable(set, 'assign')).toThrow();
    otherKeys.release();
  });

  it('boots beside a root role and an application’s role named in the reserved prefix, leaving both as they were', async () => {
    // An application's own role named so before the prefix was reserved, held by a member.
    await authz.permissionSets.create({
      key: 'system-key-sales',
      grants: [authz.settings.grant('orders', ['read'])],
    });
    await authz.permissionSets.assign({
      subject: { type: 'user', id: memberId },
      permissionSet: 'system-key-sales',
    });
    try {
      // Another instance whose root set is configured under the prefix too.
      const other = createAppAuthorization({
        connection: database.connection(),
        config: { permissionSets: { rootSet: 'system-key-operators' } },
      });
      const otherKeys = new SystemApiKeys({
        connection: () => database.connection(),
        keys,
        users: () => users,
        authorization: () => other,
      });
      const colliding = await otherKeys.collisions();
      expect(colliding).toContain('system-key-sales');
      expect(() => otherKeys.protectAll(colliding)).not.toThrow();
      // The root set stays the application's, unrestricted as configured.
      expect(
        other.permissionSets.protection('system-key-operators'),
      ).toMatchObject({ unrestricted: true });
      expect(
        other.permissionSets.protection('system-key-operators')?.owner,
      ).not.toBe('@nocobase/app-plugin-api-keys');
      // The application's role is neither hidden nor locked, and still grants its member.
      expect(
        other.permissionSets.protection('system-key-sales'),
      ).toBeUndefined();
      expect(() =>
        other.permissionSets.assertWritable('system-key-sales', 'update'),
      ).not.toThrow();
      expect(
        (
          await other.permissionSets.getEffective({
            principal: { type: 'user', id: memberId },
          })
        ).map((set) => set.key),
      ).toContain('system-key-sales');
      // A system key made after that instance started is still protected there.
      const created = await systemKeys.create(adminId, {
        name: 'beside a root role',
        expiresInDays: 30,
        permissions: readOrders,
      });
      expect(
        other.permissionSets.protection(systemKeySet(created.key.identityId))
          ?.hidden,
      ).toBe(true);
      otherKeys.release();
    } finally {
      for (const assignment of await authz.permissionSets.listAssignments(
        'system-key-sales',
      ))
        await authz.permissionSets.revoke(assignment.id);
      await authz.permissionSets.delete('system-key-sales');
    }
  });

  it('releases a reserved name into a key that fits the database, and refuses one that does not', async () => {
    const long = `system-key-${'r'.repeat(200)}`;
    const released = releasedKey(long);
    expect(released.length).toBeLessThanOrEqual(255 - 130);
    expect(released.startsWith('role-system-key-')).toBe(true);
    expect(releasedKey(long)).toBe(released);
    expect(releasedKey('system-key-sales')).toBe('role-system-key-sales');
    await authz.permissionSets.create({ key: long, grants: [] });
    try {
      await expect(
        systemKeys.releaseReserved(long, `role-${'x'.repeat(260)}`),
      ).rejects.toMatchObject({ code: 'NOT_RESERVED' });
      expect(await authz.permissionSets.get(long)).toBeTruthy();
      await expect(systemKeys.releaseReserved(long)).resolves.toBe(released);
      expect(await authz.permissionSets.get(released)).toBeTruthy();
    } finally {
      await authz.permissionSets.delete(released).catch(() => undefined);
    }
  });

  it('takes an owner who is an active member, never a service account', async () => {
    const robot = await users.createServiceAccount({ name: 'Robot owner' });
    await expect(
      systemKeys.create(adminId, {
        name: 'owned',
        ownerId: robot.id,
        expiresInDays: 30,
        permissions: readOrders,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_OWNER' });
    const created = await systemKeys.create(adminId, {
      name: 'owned',
      ownerId: memberId,
      expiresInDays: 30,
      permissions: readOrders,
    });
    expect(created.key.owner?.id).toBe(memberId);
    expect(
      (
        await call(
          `/systemApiKeys/${created.key.identityId}`,
          adminCookie,
          'PATCH',
          { ownerId: robot.id },
        )
      ).status,
    ).toBe(400);
  });

  it('changes permissions one at a time, recording each change against the one before', async () => {
    const created = await systemKeys.create(adminId, {
      name: 'busy',
      expiresInDays: 30,
      permissions: { grants: [] },
    });
    const update = {
      grants: [{ resource: orders, actions: [{ action: 'update' }] }],
    };
    await Promise.all([
      systemKeys.setPermissions(created.key.identityId, adminId, readOrders),
      systemKeys.setPermissions(created.key.identityId, adminId, update),
    ]);
    const changes = (await systemKeys.events(created.key.identityId))
      .filter((event) => event.action === 'permissions')
      .reverse()
      .map((event) => event.details as { before: unknown; after: unknown });
    expect(changes).toHaveLength(2);
    // The second change replaced what the first wrote, whichever ran first.
    expect(changes[0]!.before).toEqual({ grants: [] });
    expect(changes[1]!.before).toEqual(changes[0]!.after);
    expect((await systemKeys.get(created.key.identityId)).permissions).toEqual(
      changes[1]!.after,
    );
  });

  it('adopts a service account’s chosen key, keeping its own scope, once', async () => {
    const robot = await users.createServiceAccount({ name: 'Studio key' });
    // An application's organization key: its own scope narrower than what the account holds.
    const own = await keys.create(
      robot.id,
      { name: 'org', expiresInDays: null, permissions: readOrders },
      await keys.identityOf(adminId),
    );
    const other = await keys.create(
      robot.id,
      { name: 'other', expiresInDays: null, permissions: readOrders },
      await keys.identityOf(adminId),
    );
    const stored = async (id: string) =>
      (
        await database
          .connection()
          .query.selectFrom('apikey')
          .select(['permissions'])
          .where('id', '=', id)
          .executeTakeFirst<{ permissions: unknown }>()
      )?.permissions;
    const before = await stored(own.key.id);
    const holds = {
      grants: [
        {
          resource: orders,
          actions: [{ action: 'read' }, { action: 'update' }],
        },
      ],
    };
    // What the application's own set gives the account, as Studio's organization keys hold.
    await authz.permissionSets.create({
      key: `api-key-${robot.id}`,
      grants: holds.grants,
    });
    await authz.permissionSets.assign({
      subject: { type: 'user', id: robot.id },
      permissionSet: `api-key-${robot.id}`,
    });
    await expect(
      systemKeys.adopt({ identityId: robot.id, keyId: 'not-its-key' }),
    ).rejects.toMatchObject({ code: 'NO_KEY' });
    // Grants the account does not hold are never given.
    await expect(
      systemKeys.adopt({
        identityId: robot.id,
        keyId: own.key.id,
        permissions: {
          grants: [
            ...holds.grants,
            {
              resource: { type: 'settings', id: 'apiKeys' },
              actions: [{ action: 'read' }],
            },
          ],
        },
      }),
    ).rejects.toMatchObject({ code: 'ADOPT_NOT_HELD' });
    expect(await systemKeys.isSystemKey(robot.id)).toBe(false);
    const history = [
      {
        action: 'create' as const,
        actorId: adminId,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    const adopted = await systemKeys.adopt({
      identityId: robot.id,
      keyId: own.key.id,
      events: history,
    });
    expect(adopted.id).toBe(own.key.id);
    // The set takes what the account holds, read from it; the key keeps its narrower scope, so it still only reads.
    expect(
      (await authz.permissionSets.get(systemKeySet(robot.id)))?.grants,
    ).toEqual(holds.grants);
    expect(await stored(own.key.id)).toEqual(before);
    expect((await asKey(own.secret, '/settings/orders/read')).status).toBe(200);
    expect((await asKey(own.secret, '/settings/orders/update')).status).toBe(
      403,
    );
    expect(await stored(other.key.id)).toEqual(before);
    // The same import again adds nothing; another key of the account is refused.
    await systemKeys.adopt({
      identityId: robot.id,
      keyId: own.key.id,
      events: history,
    });
    await expect(
      systemKeys.adopt({ identityId: robot.id, keyId: other.key.id }),
    ).rejects.toMatchObject({ code: 'ALREADY_SYSTEM_KEY' });
    const events = await systemKeys.events(robot.id);
    expect(events.map((event) => event.action).sort()).toEqual([
      'adopt',
      'create',
    ]);
    // The first change records what the key held before: its own scope, which is in the current format.
    await systemKeys.setPermissions(robot.id, adminId, { grants: [] });
    const change = (await systemKeys.events(robot.id)).find(
      (event) => event.action === 'permissions',
    );
    expect(change?.details).toEqual({
      before: readOrders,
      after: { grants: [] },
    });
  });

  it('refuses to import over a role already named for the account, until it is renamed with its members', async () => {
    const robot = await users.createServiceAccount({ name: 'Taken' });
    const own = await keys.create(
      robot.id,
      { name: 'org', expiresInDays: null, permissions: readOrders },
      await keys.identityOf(adminId),
    );
    await authz.permissionSets.create({
      key: `api-key-${robot.id}`,
      grants: readOrders.grants,
    });
    await authz.permissionSets.assign({
      subject: { type: 'user', id: robot.id },
      permissionSet: `api-key-${robot.id}`,
    });
    // An application's role that happens to carry the reserved name, held by a member.
    const taken = systemKeySet(robot.id);
    await authz.permissionSets.create({ key: taken, grants: [] });
    await authz.permissionSets.assign({
      subject: { type: 'user', id: memberId },
      permissionSet: taken,
    });
    await expect(
      systemKeys.adopt({ identityId: robot.id, keyId: own.key.id }),
    ).rejects.toMatchObject({ code: 'SYSTEM_KEY_SET_TAKEN' });
    // Nothing changed: the role keeps no grants and its member.
    expect((await authz.permissionSets.get(taken))?.grants).toEqual([]);
    expect(await systemKeys.collisions()).toContain(taken);
    const renamed = await systemKeys.releaseReserved(taken);
    expect(renamed).toBe(`role-${taken}`);
    expect(
      (await authz.permissionSets.listAssignments(renamed)).map(
        (assignment) => assignment.subject.id,
      ),
    ).toEqual([memberId]);
    expect(await systemKeys.collisions()).not.toContain(taken);
    await systemKeys.adopt({ identityId: robot.id, keyId: own.key.id });
    expect(await systemKeys.isSystemKey(robot.id)).toBe(true);
    // The renamed role was left alone by the import.
    expect((await authz.permissionSets.get(renamed))?.grants).toEqual([]);
  });

  it('answers a repeated import only when it asks for the same grants, in any order', async () => {
    const robot = await users.createServiceAccount({ name: 'Replayed' });
    const own = await keys.create(
      robot.id,
      { name: 'org', expiresInDays: null, permissions: readOrders },
      await keys.identityOf(adminId),
    );
    const both = {
      grants: [
        {
          resource: orders,
          actions: [{ action: 'read' }, { action: 'update' }],
        },
      ],
    };
    await authz.permissionSets.create({
      key: `api-key-${robot.id}`,
      grants: both.grants,
    });
    await authz.permissionSets.assign({
      subject: { type: 'user', id: robot.id },
      permissionSet: `api-key-${robot.id}`,
    });
    await systemKeys.adopt({
      identityId: robot.id,
      keyId: own.key.id,
      permissions: both,
      // History brought along may hold an import of its own; it never stands for this one.
      events: [
        {
          action: 'adopt',
          actorId: null,
          details: { request: 'held' },
          createdAt: new Date(Date.now() - 86_400_000).toISOString(),
        },
      ],
    });
    // The same grants split into one per action and listed the other way round are the same import.
    await expect(
      systemKeys.adopt({
        identityId: robot.id,
        keyId: own.key.id,
        permissions: {
          grants: [
            { resource: orders, actions: [{ action: 'update' }] },
            { resource: orders, actions: [{ action: 'read' }] },
          ],
        },
      }),
    ).resolves.toMatchObject({ identityId: robot.id });
    // The same grants written in another order are the same import.
    await expect(
      systemKeys.adopt({
        identityId: robot.id,
        keyId: own.key.id,
        permissions: {
          grants: [
            {
              resource: orders,
              actions: [{ action: 'update' }, { action: 'read' }],
            },
          ],
        },
      }),
    ).resolves.toMatchObject({ identityId: robot.id });
    // Other grants, or none given, are another request.
    for (const permissions of [readOrders, undefined])
      await expect(
        systemKeys.adopt({
          identityId: robot.id,
          keyId: own.key.id,
          ...(permissions ? { permissions } : {}),
        }),
      ).rejects.toMatchObject({ code: 'ALREADY_SYSTEM_KEY' });
  });

  it('finishes deleting a key whose account could not be removed, when deleted again', async () => {
    const created = await systemKeys.create(adminId, {
      name: 'half deleted',
      expiresInDays: 30,
      permissions: readOrders,
    });
    const identityId = created.key.identityId;
    const remove = vi
      .spyOn(users, 'remove')
      .mockRejectedValueOnce(new Error('authentication store down'));
    try {
      await expect(systemKeys.remove(identityId, adminId)).rejects.toThrow(
        'authentication store down',
      );
      // The key is gone, its account not yet.
      expect(await systemKeys.isSystemKey(identityId)).toBe(false);
      expect(await users.get(identityId)).toBeTruthy();
      await systemKeys.remove(identityId, adminId);
      expect(await users.get(identityId)).toBeFalsy();
      // Once done, there is nothing to delete.
      await expect(
        systemKeys.remove(identityId, adminId),
      ).rejects.toMatchObject({ code: 'SYSTEM_KEY_NOT_FOUND' });
    } finally {
      remove.mockRestore();
    }
  });

  it('finishes deleting a key whose account was marked deleted before its cleanup failed, and tells its manager once', async () => {
    const revoked = vi.fn();
    const release = systemKeys.managers.add('half-deleted-ci', {
      onRevoked: revoked,
    });
    const managed = await systemKeys.createManaged(
      memberId,
      { name: 'CI half deleted', expiresInDays: 30, permissions: readOrders },
      { kind: 'half-deleted-ci', id: 'repo-2', title: 'acme/api' },
    );
    const identityId = managed.key.identityId;
    // The authentication plugin marks the account deleted, then fails removing its sessions.
    const remove = vi
      .spyOn(users, 'remove')
      .mockImplementationOnce(async (userId) => {
        await database
          .connection()
          .query.updateTable('user')
          .set({ deletedAt: new Date(), disabledAt: new Date() })
          .where('id', '=', userId)
          .execute();
        throw new Error('session store down');
      });
    try {
      await expect(systemKeys.remove(identityId, adminId)).rejects.toThrow(
        'session store down',
      );
      expect(await users.get(identityId)).toBeFalsy();
      expect(revoked).not.toHaveBeenCalled();
      await systemKeys.remove(identityId, adminId);
      expect(remove).toHaveBeenCalledTimes(2);
      const accounts = await database
        .connection()
        .query.selectFrom('account')
        .select(['id'])
        .where('userId', '=', identityId)
        .execute();
      expect(accounts).toEqual([]);
      expect(revoked).toHaveBeenCalledTimes(1);
      expect(revoked).toHaveBeenLastCalledWith(
        expect.objectContaining({
          identityId,
          how: 'deleted',
          noticeId: expect.any(String),
        }),
      );
      await expect(
        systemKeys.remove(identityId, adminId),
      ).rejects.toMatchObject({ code: 'SYSTEM_KEY_NOT_FOUND' });
      expect(revoked).toHaveBeenCalledTimes(1);
    } finally {
      remove.mockRestore();
      release();
    }
  });

  it('lets a feature manage keys for a person, never past what they hold, and tells it of a revocation', async () => {
    const revoked = vi.fn();
    const release = systemKeys.managers.add('repository-ci', {
      onRevoked: revoked,
    });
    try {
      const managedBy = {
        kind: 'repository-ci',
        id: 'repo-1',
        title: 'acme/web',
      };
      await expect(
        systemKeys.createManaged(
          memberId,
          {
            name: 'CI',
            expiresInDays: 30,
            permissions: {
              grants: [{ resource: orders, actions: [{ action: 'update' }] }],
            },
          },
          managedBy,
        ),
      ).rejects.toMatchObject({ code: 'KEY_SCOPE_EXCEEDS_YOURS' });
      const managed = await systemKeys.createManaged(
        memberId,
        { name: 'CI', expiresInDays: 30, permissions: readOrders },
        managedBy,
      );
      expect(managed.key.managedBy).toEqual(managedBy);
      // An administrator does not change a managed key's permissions or rotate it here.
      expect(
        (
          await call(
            `/systemApiKeys/${managed.key.identityId}/permissions`,
            adminCookie,
            'PUT',
            { permissions: readOrders },
          )
        ).status,
      ).toBe(400);
      // Nor edits or re-enables it.
      expect(
        (
          await call(
            `/systemApiKeys/${managed.key.identityId}`,
            adminCookie,
            'PATCH',
            { name: 'renamed' },
          )
        ).status,
      ).toBe(400);
      // A manager that fails is told again later.
      revoked.mockRejectedValueOnce(new Error('manager down'));
      await call(
        `/systemApiKeys/${managed.key.identityId}/disable`,
        adminCookie,
        'POST',
      );
      expect(revoked).toHaveBeenCalledTimes(1);
      expect(
        (
          await call(
            `/systemApiKeys/${managed.key.identityId}/enable`,
            adminCookie,
            'POST',
          )
        ).status,
      ).toBe(400);
      expect(await systemKeys.deliverNotices()).toBe(1);
      expect(await systemKeys.deliverNotices()).toBe(0);
      expect(revoked).toHaveBeenCalledTimes(2);
      expect(revoked).toHaveBeenLastCalledWith({
        noticeId: expect.any(String),
        identityId: managed.key.identityId,
        managedBy,
        actorId: adminId,
        how: 'disabled',
      });
      // The retry carries the same notice as the failed attempt, so the manager can tell a repeat.
      expect(revoked.mock.calls[0]![0].noticeId).toBe(
        revoked.mock.calls[1]![0].noticeId,
      );
      await call(
        `/systemApiKeys/${managed.key.identityId}`,
        adminCookie,
        'DELETE',
      );
      expect(revoked).toHaveBeenLastCalledWith(
        expect.objectContaining({ how: 'deleted' }),
      );
    } finally {
      release();
    }
  });

  it('shows administrators members’ keys to revoke, never their secret, and never system keys', async () => {
    const own = await keys.create(
      memberId,
      { name: 'laptop', expiresInDays: 7, permissions: readOrders },
      await keys.identityOf(memberId),
    );
    await keys.setRules(
      {
        allowSameAsMe: true,
        personalMaxDays: null,
        personalDefaultDays: 90,
        idleDisableDays: null,
      },
      adminId,
    );
    const full = await keys.create(
      memberId,
      { name: 'script', expiresInDays: 7, permissions: null },
      await keys.identityOf(memberId),
    );
    await systemKeys.create(adminId, {
      name: 'system',
      expiresInDays: 7,
      permissions: readOrders,
    });
    const listed = (await (
      await call('/apiKeys/members', adminCookie)
    ).json()) as {
      data: { id: string; name: string; member: { id: string } }[];
    };
    expect(listed.data.map((key) => key.name).sort()).toEqual([
      'laptop',
      'script',
    ]);
    expect(JSON.stringify(listed)).not.toContain(own.secret);
    const sameAsMember = (await (
      await call('/apiKeys/members?sameAsMember=true', adminCookie)
    ).json()) as { data: { id: string }[] };
    expect(sameAsMember.data.map((key) => key.id)).toEqual([full.key.id]);
    // One key by its id, as a picker names the key it was opened with.
    const byId = (await (
      await call(`/apiKeys/members?keyId=${own.key.id}`, adminCookie)
    ).json()) as { data: { id: string }[] };
    expect(byId.data.map((key) => key.id)).toEqual([own.key.id]);
    const system = (await systemKeys.list({ search: 'system' })).data[0]!;
    expect(
      (await systemKeys.list({ keyId: system.id })).data.map((key) => key.id),
    ).toEqual([system.id]);
    expect(
      (await call(`/apiKeys/members/${full.key.id}`, adminCookie, 'DELETE'))
        .status,
    ).toBe(204);
    expect((await asKey(full.secret, '/settings/orders/read')).status).toBe(
      401,
    );
  });

  it('applies the rules to keys made or rotated afterwards', async () => {
    const save = (input: Record<string, unknown>) =>
      call('/apiKeys/rules', adminCookie, 'PUT', {
        allowSameAsMe: false,
        personalMaxDays: null,
        personalDefaultDays: 30,
        idleDisableDays: null,
        ...input,
      });
    const before = await keys.create(
      memberId,
      { name: 'long', expiresInDays: 365, permissions: readOrders },
      await keys.identityOf(memberId),
    );
    expect((await save({ personalMaxDays: 30 })).status).toBe(200);
    // A key that exists keeps its expiry.
    expect((await keys.get(memberId, before.key.id)).expiresAt).toBe(
      before.key.expiresAt,
    );
    await expect(
      keys.create(
        memberId,
        { name: 'too long', expiresInDays: 60, permissions: readOrders },
        await keys.identityOf(memberId),
      ),
    ).rejects.toMatchObject({ code: 'INVALID_EXPIRY' });
    await expect(
      keys.create(
        memberId,
        { name: 'full', expiresInDays: 7, permissions: null },
        await keys.identityOf(memberId),
      ),
    ).rejects.toMatchObject({ code: 'SAME_AS_ME_DISABLED' });
    // Rotated now, it renews for no longer than the rule allows.
    const rotated = await keys.rotate(memberId, before.key.id);
    const lifetime =
      new Date(rotated.key.expiresAt!).getTime() -
      new Date(rotated.key.createdAt).getTime();
    expect(Math.round(lifetime / DAY)).toBe(30);
    expect(
      (await save({ personalDefaultDays: 60, personalMaxDays: 30 })).status,
    ).toBe(400);
  });

  it('disables idle keys by the rule each key took when issued or rotated, a week after reminding, and reminds of a system key expiring', async () => {
    const reminders: IdleReminder[] = [];
    const idle = new IdleKeys({
      connection: () => database.connection(),
      config: () => ({}),
      systemKeys,
      remind: (reminder) => {
        reminders.push(reminder);
        return Promise.resolve();
      },
    });
    const rules = (idleDisableDays: number | null) =>
      keys.setRules(
        {
          allowSameAsMe: false,
          personalMaxDays: 30,
          personalDefaultDays: 30,
          idleDisableDays,
        },
        adminId,
      );
    await rules(null);
    // Made while the rule is off: the rule turned on later does not reach it.
    const older = await keys.create(
      memberId,
      { name: 'older', expiresInDays: 30, permissions: readOrders },
      await keys.identityOf(memberId),
    );
    await rules(30);
    const fresh = await keys.create(
      memberId,
      { name: 'fresh', expiresInDays: 30, permissions: readOrders },
      await keys.identityOf(memberId),
    );
    const start = Date.now();
    const at = (day: number) => new Date(start + day * DAY);
    const enabled = async (id: string) =>
      (await keys.get(memberId, id)).enabled;
    const about = (id: string) =>
      reminders.filter((entry) => entry.keyId === id && entry.kind === 'idle');
    await idle.sweep(at(22));
    expect(about(fresh.key.id)).toEqual([]);
    await idle.sweep(at(23));
    expect(about(fresh.key.id)).toHaveLength(1);
    expect(about(fresh.key.id)[0]).toMatchObject({ userId: memberId });
    // A sweep that did not run for a while does not disable it the day it resumes: a week after the reminder.
    await idle.sweep(at(29));
    expect(await enabled(fresh.key.id)).toBe(true);
    // A change of the rule does not reach a key already made.
    await rules(60);
    await idle.sweep(at(31));
    expect(await enabled(fresh.key.id)).toBe(false);
    expect(await enabled(older.key.id)).toBe(true);
    expect(about(older.key.id)).toEqual([]);
    // Rotated, the older key takes the rule in force now (60 days) and is reminded by it, not before.
    await keys.rotate(memberId, older.key.id);
    const rotatedAt = Date.now();
    await idle.sweep(new Date(rotatedAt + 52 * DAY));
    expect(about(older.key.id)).toEqual([]);
    await idle.sweep(new Date(rotatedAt + 53 * DAY));
    expect(about(older.key.id)).toHaveLength(1);
    // A system key's owner is told once that it expires within a week.
    await rules(null);
    const expiring = await systemKeys.create(adminId, {
      name: 'expiring',
      ownerId: adminId,
      expiresInDays: 10,
      permissions: readOrders,
    });
    const expiryOf = () =>
      reminders.filter(
        (entry) => entry.kind === 'expiry' && entry.keyId === expiring.key.id,
      );
    await idle.sweep(at(2));
    expect(expiryOf()).toEqual([]);
    await idle.sweep(at(4));
    await idle.sweep(at(5));
    expect(expiryOf()).toEqual([
      expect.objectContaining({ userId: adminId, system: true }),
    ]);
  });
});

describe('the records a system key may reach', () => {
  const composite = (quote: unknown, action = 'view') => ({
    grants: [
      {
        resource: { type: 'composite', id: 'shop.quotes' },
        actions: [{ action, policy: { type: 'composite', scopes: { quote } } }],
      },
    ],
  });

  it('are every record or chosen ones, never one counted from a person', () => {
    for (const quote of [
      'allRecords',
      { type: 'all' },
      { type: 'records', ids: ['q1'] },
      '',
    ])
      expect(() => assertSystemPermissions(composite(quote))).not.toThrow();
    for (const quote of [
      'recordsIOwn',
      { type: 'recordAccess', key: 'mine' },
      { type: 'recordAccess', key: 'allRecords', params: { field: 'x' } },
    ])
      expect(() => assertSystemPermissions(composite(quote))).toThrow(
        expect.objectContaining({ code: 'SYSTEM_KEY_SCOPE' }),
      );
    // A level relative to a person neither.
    expect(() =>
      assertSystemPermissions({
        grants: [
          {
            resource: { type: 'rel', id: 'rel.apps' },
            actions: [{ action: 'deploy.related' }],
          },
        ],
      }),
    ).toThrow(expect.objectContaining({ code: 'SYSTEM_KEY_SCOPE' }));
  });
});
