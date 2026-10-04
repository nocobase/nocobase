import type { DatabaseConnection } from '@nocobase/db';
import { databaseManagerToken } from '@nocobase/db';
import { realtimeServiceToken } from '@nocobase/app-server/realtime';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { PERMISSION_SETS_PROTECTION_OWNER } from '@nocobase/authorization/permission-sets';
import type {
  AuthorizationContext,
  AuthorizationPlugin,
} from '@nocobase/authorization/core';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import {
  createAppAuthorization,
  type AuthorizationConfig,
} from '../../server/authorization.js';
import {
  AuthorizationProvider,
  authorizationToken,
} from '../../server/index.js';
import { createTestDatabase } from '@nocobase/app-testing/server';
import { migratePlugins } from '../helpers/database-fixture.js';
import { mountedRouter } from '../helpers/mounted-router.js';
import { testRulePlugin } from '../helpers/rule-plugin.js';

/** Permission Sets need a connection to build their store; nothing here queries. */
const connection = { query: {} } as unknown as DatabaseConnection;

interface TestEnv {
  Variables: {
    auth?: { user: { id: string } };
    authz: AuthorizationContext;
  };
}

async function signedInAs(
  auth: { user: { id: string } } | undefined,
): Promise<Response> {
  const authorization = createAppAuthorization({ connection });
  const router = new Hono<TestEnv>();
  router.onError((error, context) =>
    context.json({ message: error.message }, 500),
  );
  router.use('*', async (context, next) => {
    if (auth) context.set('auth', auth);
    await next();
  });
  router.use('*', authorization.middleware());
  router.get('/', (context) => {
    const { identity } = context.get('authz');
    return context.json({
      principal: identity.principal,
      subjects: identity.subjects,
    });
  });
  return router.request('/');
}

describe('the identity an application resolves for a request', () => {
  it('resolves the principal and the authenticated subject from the session', async () => {
    const response = await signedInAs({ user: { id: 'alice' } });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      principal: { type: 'user', id: 'alice' },
      subjects: [{ type: 'authenticated', id: '*' }],
    });
  });

  it('refuses a request that carries no authenticated session', async () => {
    const response = await signedInAs(undefined);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: 'Authorization requires an authenticated session',
    });
  });
});

describe('what an application configures about its own authorization', () => {
  const member = {
    owner: PERMISSION_SETS_PROTECTION_OWNER,
    allow: ['update'],
  };
  const root = (key: string) => ({
    [key]: {
      owner: PERMISSION_SETS_PROTECTION_OWNER,
      allow: ['assign', 'revoke'],
      requireActiveAssignment: true,
      unrestricted: true,
      // A superuser is an account; this host's principal type is `user`.
      assignableTo: ['user'],
    },
  });

  it.each([
    [
      'the default sets',
      {},
      { ...root('root'), member, owner: undefined, everyone: undefined },
    ],
    [
      'the sets the application names',
      { permissionSets: { rootSet: 'owner', defaultSet: 'everyone' } },
      {
        ...root('owner'),
        everyone: member,
        root: undefined,
        member: undefined,
      },
    ],
  ] as const)(
    'protects %s through the Permission Sets plugin',
    (_name, config: AuthorizationConfig, expected) => {
      const authorization = createAppAuthorization({ connection, config });
      for (const [key, protection] of Object.entries(expected))
        expect(authorization.permissionSets.protection(key)).toEqual(
          protection,
        );
    },
  );

  // The mount used to be a constant in the route file, so a router mounted
  // anywhere else answered 404 on every plugin surface while the
  // application's own endpoints kept working.
  it('answers the plugin surfaces it installed, and no others, under whatever prefix the router is mounted at', async () => {
    const authorization = createAppAuthorization({
      connection,
      config: { plugins: [testRulePlugin('restriction-rules')] },
    });
    authorization.permissionSets.protect({
      owner: '@nocobase/test',
      keys: ['admin-set'],
      unrestricted: true,
    });
    vi.spyOn(authorization.permissionSets, 'getEffective').mockResolvedValue([
      { key: 'admin-set', grants: [] },
    ]);
    const router = new Hono().route(
      '/portal',
      await mountedRouter(authorization),
    );

    const [installed, rule, missing] = await Promise.all([
      router.request('/portal/api/authorization/permissionSets/options'),
      router.request('/portal/api/authorization/restrictionRules/options'),
      router.request('/portal/api/authorization/sharingRules'),
    ]);

    expect([installed.status, rule.status, missing.status]).toEqual([
      200, 200, 404,
    ]);
  });

  it('refuses an application plugin that also provides grants', () => {
    const grantsOnly: AuthorizationPlugin = {
      id: 'test-grants',
      grants: {
        resolve: () => Promise.resolve([]),
        resolveAll: () => Promise.resolve([]),
      },
    };

    expect(() =>
      createAppAuthorization({ connection, config: { plugins: [grantsOnly] } }),
    ).toThrow('multiple Grant Providers');
  });
});

describe('the authorization provider', () => {
  it('resolves a database-backed authorization and publishes targeted and global permission invalidations', async () => {
    const testDatabase = await createTestDatabase();
    const { database } = testDatabase;
    await migratePlugins(database, 'app-plugin-authorization');
    const container = new ServiceContainer();
    container.instance(databaseManagerToken, database);
    const publishFor = vi.fn();
    const publish = vi.fn();
    const closeUser = vi.fn();
    const closeGlobal = vi.fn();
    const defineTopic = vi
      .fn()
      .mockReturnValueOnce({ publishFor, close: closeUser })
      .mockReturnValueOnce({ publish, close: closeGlobal });
    container.instance(realtimeServiceToken, { defineTopic } as never);
    const provider = new AuthorizationProvider({
      container,
      config: {
        get: () => ({ permissionSets: { rootSet: 'owner' } }),
      },
    } as unknown as AppPluginApplication);

    try {
      provider.register();
      await provider.boot();
      const authorization = container.resolve(authorizationToken);
      expect(authorization.permissionSets.protection('owner')).toMatchObject({
        unrestricted: true,
      });
      await authorization.permissionSets.create({ key: 'reader', grants: [] });
      await authorization.permissionSets.assign({
        subject: { type: 'user', id: 'alice' },
        permissionSet: 'reader',
      });
      await authorization.permissionSets.assign({
        subject: { type: 'authenticated', id: '*' },
        permissionSet: 'reader',
      });

      expect(
        await database
          .connection()
          .query.selectFrom('authorizationPermissionSetAssignments')
          .select('subjectId')
          .execute(),
      ).toHaveLength(2);
      expect(publishFor).toHaveBeenCalledExactlyOnceWith('alice', {
        type: 'permissions-changed',
      });
      expect(publish).toHaveBeenCalledExactlyOnceWith({
        type: 'permissions-changed',
      });

      await provider.shutdown();
      expect(closeUser).toHaveBeenCalledOnce();
      expect(closeGlobal).toHaveBeenCalledOnce();
    } finally {
      await testDatabase.destroy();
    }
  });

  it('reports a stored grant that no longer applies at startup: throws in development and warns in production', async () => {
    const testDatabase = await createTestDatabase();
    const { database } = testDatabase;
    await migratePlugins(database, 'app-plugin-authorization');
    const container = new ServiceContainer();
    container.instance(databaseManagerToken, database);
    const provider = new AuthorizationProvider({
      container,
      config: { get: () => undefined },
    } as unknown as AppPluginApplication);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      provider.register();
      await provider.boot();
      const authorization = container.resolve(authorizationToken);
      authorization.compositeResources.define({
        name: 'sales.quotes',
        title: 'Quotes',
        actions: [
          {
            name: 'submit',
            title: 'Submit',
            grants: [
              {
                resource: { type: 'settings', id: 'authorization.inspector' },
                actions: [{ action: 'inspect' }],
              },
            ],
          },
        ],
      });
      // A seed wrote a scope the definition does not declare; the
      // Permission Set routes would have refused it.
      const now = new Date();
      await database
        .connection()
        .query.insertInto('authorizationPermissionSets')
        .values({
          id: 'broken-set',
          key: 'broken',
          title: JSON.stringify('Broken'),
          grants: JSON.stringify([
            {
              resource: { type: 'composite', id: 'sales.quotes' },
              actions: [
                {
                  action: 'submit',
                  policy: {
                    type: 'composite',
                    scopes: { extra: 'allRecords' },
                  },
                },
              ],
            },
          ]),
          createdAt: now,
          updatedAt: now,
        })
        .execute();
      const problem =
        'Permission set broken grants composite:sales.quotes.submit, which no longer applies: Unknown data scope: submit.extra';

      vi.stubEnv('NODE_ENV', 'development');
      await expect(provider.start()).rejects.toThrow(problem);
      vi.stubEnv('NODE_ENV', 'production');
      await expect(provider.start()).resolves.toBeUndefined();
      expect(warn).toHaveBeenCalledWith(`Authorization: ${problem}`);
    } finally {
      vi.unstubAllEnvs();
      warn.mockRestore();
      await testDatabase.destroy();
    }
  });
});

describe('stored write grants at startup', () => {
  it('reports a create or update grant naming a field a write can no longer use', async () => {
    const testDatabase = await createTestDatabase();
    const { database } = testDatabase;
    await migratePlugins(database, 'app-plugin-authorization');
    await database
      .connection()
      .builder.createCollection('counters', (counters) => {
        counters.increments('id').primary();
        counters.string('title', { length: 120 });
      });
    const container = new ServiceContainer();
    container.instance(databaseManagerToken, database);
    const provider = new AuthorizationProvider({
      container,
      config: { get: () => undefined },
    } as unknown as AppPluginApplication);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      provider.register();
      await provider.boot();
      const authorization = container.resolve(authorizationToken);
      authorization.compositeResources.define({
        name: 'test.counters',
        title: 'Counters',
        actions: [
          {
            name: 'edit',
            title: 'Edit',
            grants: [
              {
                resource: { type: 'database.collection', id: 'counters' },
                actions: [
                  {
                    action: 'update',
                    policy: { type: 'database', fields: ['title', 'gone'] },
                  },
                ],
              },
            ],
          },
        ],
      });
      // Saved before `amount` was dropped from `counters`, or written by a seed the routes never saw.
      const now = new Date();
      await database
        .connection()
        .query.insertInto('authorizationPermissionSets')
        .values({
          id: 'stale-set',
          key: 'stale',
          title: JSON.stringify('Stale'),
          grants: JSON.stringify([
            {
              resource: { type: 'database.collection', id: 'counters' },
              actions: [
                {
                  action: 'read',
                  policy: { type: 'database', fields: ['amount'] },
                },
                {
                  action: 'update',
                  policy: { type: 'database', fields: ['title', 'amount'] },
                },
              ],
            },
            {
              resource: { type: 'composite', id: 'test.counters' },
              actions: [{ action: 'edit' }],
            },
          ]),
          createdAt: now,
          updatedAt: now,
        })
        .execute();

      vi.stubEnv('NODE_ENV', 'production');
      await expect(provider.start()).resolves.toBeUndefined();
      expect(
        warn.mock.calls
          .map(([message]) => String(message))
          .filter((message) => message.includes('Permission set')),
      ).toEqual([
        'Authorization: Permission set stale grants composite:test.counters.edit, whose database grants name what a write cannot use: Field "gone" is not a writable scalar field of "counters".',
        'Authorization: Permission set stale has a write grant that no longer applies at grants.0.actions.1.policy.fields.1: Field "amount" is not a writable scalar field of "counters".',
      ]);
    } finally {
      vi.unstubAllEnvs();
      warn.mockRestore();
      await testDatabase.destroy();
    }
  });
});

describe('refreshing clients after an assignment changes', () => {
  it('refreshes one user for a user, and everyone for any other subject', async () => {
    const onUserPermissionsChanged = vi.fn();
    const onAuthenticatedPermissionsChanged = vi.fn();
    const authz = createAppAuthorization({
      connection,
      onUserPermissionsChanged,
      onAuthenticatedPermissionsChanged,
    });

    await authz.permissionSets.notifyAssignmentsChanged({
      type: 'user',
      id: 'alice',
    });
    expect(onUserPermissionsChanged).toHaveBeenCalledWith('alice');
    expect(onAuthenticatedPermissionsChanged).not.toHaveBeenCalled();

    for (const subject of [
      { type: 'authenticated', id: '*' },
      { type: 'department', id: 'sales' },
    ])
      await authz.permissionSets.notifyAssignmentsChanged(subject);
    expect(onAuthenticatedPermissionsChanged).toHaveBeenCalledTimes(2);
    expect(onUserPermissionsChanged).toHaveBeenCalledTimes(1);
  });
});
