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
    await expect(
      systemKeys.adopt({
        identityId: robot.id,
        keyId: 'not-its-key',
        permissions: readOrders,
      }),
    ).rejects.toMatchObject({ code: 'NO_KEY' });
    expect(await systemKeys.isSystemKey(robot.id)).toBe(false);
    const holds = {
      grants: [
        {
          resource: orders,
          actions: [{ action: 'read' }, { action: 'update' }],
        },
      ],
    };
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
      permissions: holds,
      events: history,
    });
    expect(adopted.id).toBe(own.key.id);
    // The set takes what the account held; the key keeps its narrower scope, so it still only reads.
    expect(await stored(own.key.id)).toEqual(before);
    expect((await asKey(own.secret, '/settings/orders/read')).status).toBe(200);
    expect((await asKey(own.secret, '/settings/orders/update')).status).toBe(
      403,
    );
    expect(await stored(other.key.id)).toEqual(before);
    // Again, nothing is added twice.
    await systemKeys.adopt({
      identityId: robot.id,
      keyId: own.key.id,
      permissions: holds,
      events: history,
    });
    const events = await systemKeys.events(robot.id);
    expect(events.map((event) => event.action).sort()).toEqual([
      'adopt',
      'create',
    ]);
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
        identityId: managed.key.identityId,
        managedBy,
        actorId: adminId,
        how: 'disabled',
      });
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
