/**
 * The records a system key reaches, against real tables: chosen records a maker who sees only their own may give,
 * default access counted from "me" adding none for a system key, and restriction rules still applying.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  Auth,
  createUserAdministrationService,
  type UserAdministrationService,
} from '@nocobase/app-plugin-authentication/server';
import {
  createAppAuthorization,
  type AppAuthorization,
} from '@nocobase/app-plugin-authorization';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import type {
  AccessConstraint,
  AuthorizationIdentity,
} from '@nocobase/authorization/core';
import { createMigrator, type DatabaseManager } from '@nocobase/db';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { apiKey } from '../server/api-keys.js';
import { ScopedApiKeys } from '../server/scoped-keys.js';
import { createApiKeyScopes } from '../server/scopes.js';
import { SystemApiKeys } from '../server/system-keys.js';

const require = createRequire(import.meta.url);
const quotes = { type: 'composite', id: 'shop.quotes' } as const;
const view = (quote: unknown) => ({
  grants: [
    {
      resource: quotes,
      actions: [
        { action: 'view', policy: { type: 'composite', scopes: { quote } } },
      ],
    },
  ],
});

describe('the records a system key reaches', () => {
  let testDatabase: TestDatabase;
  let database: DatabaseManager;
  let authz: AppAuthorization;
  let users: UserAdministrationService;
  let keys: ScopedApiKeys;
  let systemKeys: SystemApiKeys;
  let mariaId = '';
  /** A restriction rule the test turns on: quotes read only within these. */
  let restriction: readonly string[] | undefined;

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
    await database
      .connection()
      .builder.createCollection('quotes', (collection) => {
        collection.string('id', { length: 64 }).notNull();
        collection.string('title', { length: 120 }).nullable();
        collection.string('ownerId', { length: 64 }).nullable();
        collection.primary('id', { name: 'pk_quotes' });
      });

    const auth = new Auth({
      connection: database.connection(),
      baseURL: 'http://localhost/api/auth',
      secret: 'development-secret-at-least-32-characters',
      plugins: [apiKey()],
      emailAndPassword: { enabled: true },
      session: { storeSessionInDatabase: true },
    });
    users = createUserAdministrationService({
      auth,
      connection: database.connection(),
    });
    mariaId = (
      await users.create({
        name: 'Maria',
        email: 'maria@example.com',
        password: 'password-at-least-8',
      })
    ).id;

    authz = createAppAuthorization({
      connection: database.connection(),
      database,
      config: {
        plugins: [
          {
            id: 'rules',
            setup(setup) {
              setup.constraints.add({
                id: 'rules',
                resolve: (input) => {
                  if (input.resource.id !== 'quotes')
                    return Promise.resolve([]);
                  const found: AccessConstraint[] = [
                    // Default access: everyone reads the quotes they own.
                    {
                      source: { plugin: 'default-access', id: 'own-quotes' },
                      effect: 'expand',
                      selection: { type: 'recordAccess', key: 'recordsIOwn' },
                    },
                  ];
                  if (restriction)
                    found.push({
                      source: { plugin: 'restriction-rules', id: 'some' },
                      effect: 'restrict',
                      selection: { type: 'records', ids: [...restriction] },
                    });
                  return Promise.resolve(found);
                },
              });
            },
          },
        ],
      },
    });
    authz.database.collections.add({ name: 'quotes', title: 'Quotes' });
    authz.compositeResources.define({
      name: 'shop.quotes',
      title: 'Quotes',
      actions: [
        {
          name: 'view',
          title: 'View',
          dataScopes: [{ key: 'quote', title: 'Quotes' }],
          grants: [
            {
              resource: { type: 'database.collection', id: 'quotes' },
              actions: [
                {
                  action: 'read',
                  scopeKey: 'quote',
                  policy: {
                    type: 'database',
                    fields: ['id', 'title', 'ownerId'],
                  },
                },
              ],
            },
          ],
        },
      ],
    });
    // Maria sees only the quotes she owns.
    await authz.permissionSets.create({
      key: 'sales',
      grants: view('recordsIOwn').grants,
    });
    await authz.permissionSets.assign({
      subject: { type: 'user', id: mariaId },
      permissionSet: 'sales',
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
    systemKeys.protectAll();
    await database
      .connection()
      .query.insertInto('quotes')
      .values([
        { id: 'q1', title: 'Maria one', ownerId: mariaId },
        { id: 'q2', title: 'Maria two', ownerId: mariaId },
        { id: 'q3', title: 'Someone else', ownerId: 'someone' },
      ])
      .execute();
  });

  afterAll(async () => {
    await testDatabase.destroy();
  });

  const seen = async (identity: AuthorizationIdentity) =>
    (
      await keys.scopeRecords(identity, {
        resource: 'shop.quotes',
        action: 'view',
        scope: 'quote',
      })
    ).records
      .map((record) => record.id)
      .sort();

  it('lets a maker who sees only their own records give the ones they see, never others or every record', async () => {
    const maria = await keys.identityOf(mariaId);
    expect(await seen(maria)).toEqual(['q1', 'q2']);
    const create = (quote: unknown) =>
      systemKeys.create(mariaId, {
        name: 'quotes',
        expiresInDays: 30,
        permissions: view(quote),
      });
    await expect(
      create({ type: 'records', ids: ['q3'] }),
    ).rejects.toMatchObject({
      status: 403,
      code: 'KEY_SCOPE_EXCEEDS_YOURS',
    });
    await expect(
      create({ type: 'records', ids: ['q1', 'q3'] }),
    ).rejects.toMatchObject({ code: 'KEY_SCOPE_EXCEEDS_YOURS' });
    await expect(create({ type: 'all' })).rejects.toMatchObject({
      code: 'KEY_SCOPE_EXCEEDS_YOURS',
    });
    // Left out, it would be Maria's own, which means nothing for a key that is no person.
    await expect(
      systemKeys.create(mariaId, {
        name: 'quotes',
        expiresInDays: 30,
        permissions: {
          grants: [{ resource: quotes, actions: [{ action: 'view' }] }],
        },
      }),
    ).rejects.toMatchObject({ code: 'SYSTEM_KEY_SCOPE' });
    const created = await create({ type: 'records', ids: ['q1'] });
    const inspected = await keys.inspectKey(created.key.id);
    expect(inspected?.identity.keyScope?.personless).toBe(true);
    // The key reads exactly the record chosen.
    expect(await seen(inspected!.identity)).toEqual(['q1']);
  });

  it('gives a system key no records default access counts from "me", and keeps restriction rules', async () => {
    // An application's own service account with a key bounded only by the account: as an adopted key keeps.
    const robot = await users.createServiceAccount({ name: 'Robot' });
    await database
      .connection()
      .query.insertInto('quotes')
      .values({ id: 'q4', title: 'The robot’s', ownerId: robot.id })
      .execute();
    await authz.permissionSets.create({
      key: 'robot',
      grants: view({ type: 'records', ids: ['q2'] }).grants,
    });
    await authz.permissionSets.assign({
      subject: { type: 'user', id: robot.id },
      permissionSet: 'robot',
    });
    const key = await keys.create(
      robot.id,
      { name: 'robot', expiresInDays: null, scope: null },
      await keys.identityOf(robot.id),
    );
    // Not a system key: default access adds the records it owns.
    expect(await seen((await keys.inspectKey(key.key.id))!.identity)).toEqual([
      'q2',
      'q4',
    ]);
    await systemKeys.adopt({
      identityId: robot.id,
      keyId: key.key.id,
      permissions: view({ type: 'records', ids: ['q2'] }),
    });
    const adopted = (await keys.inspectKey(key.key.id))!.identity;
    expect(adopted.keyScope?.personless).toBe(true);
    // A system key: what default access counts from "me" adds nothing.
    expect(await seen(adopted)).toEqual(['q2']);
    // A restriction rule still narrows it.
    restriction = ['q1'];
    try {
      expect(await seen(adopted)).toEqual([]);
    } finally {
      restriction = undefined;
    }
    // Its first change records what it held before, from its set, though its own scope is not in the current format.
    await systemKeys.setPermissions(
      robot.id,
      mariaId,
      view({ type: 'records', ids: ['q1'] }),
    );
    const change = (await systemKeys.events(robot.id)).find(
      (event) => event.action === 'permissions',
    );
    expect(change?.details).toMatchObject({
      before: view({ type: 'records', ids: ['q2'] }),
    });
  });

  it('adopts a key wider than its account as no wider than the account', async () => {
    const robot = await users.createServiceAccount({ name: 'Narrow robot' });
    await authz.permissionSets.create({
      key: `api-key-${robot.id}`,
      grants: view({ type: 'records', ids: ['q2'] }).grants,
    });
    await authz.permissionSets.assign({
      subject: { type: 'user', id: robot.id },
      permissionSet: `api-key-${robot.id}`,
    });
    // The key itself names more records than the account holds.
    const key = await keys.create(
      robot.id,
      {
        name: 'wide',
        expiresInDays: null,
        permissions: view({ type: 'records', ids: ['q1', 'q2'] }),
      },
      await keys.identityOf(mariaId),
    );
    await expect(
      systemKeys.adopt({
        identityId: robot.id,
        keyId: key.key.id,
        permissions: view({ type: 'records', ids: ['q1', 'q2'] }),
      }),
    ).rejects.toMatchObject({ code: 'ADOPT_NOT_HELD' });
    await systemKeys.adopt({ identityId: robot.id, keyId: key.key.id });
    // Its application removes its own set afterwards; the system key holds no more than the account did.
    await authz.permissionSets.delete(`api-key-${robot.id}`);
    expect(await seen((await keys.inspectKey(key.key.id))!.identity)).toEqual([
      'q2',
    ]);
  });

  it('checks chosen records against what the giver reaches, restriction rules included, under a role of every record', async () => {
    const olgaId = (
      await users.create({
        name: 'Olga',
        email: 'olga@example.com',
        password: 'password-at-least-8',
      })
    ).id;
    await authz.permissionSets.create({
      key: 'all-quotes',
      grants: view('allRecords').grants,
    });
    await authz.permissionSets.assign({
      subject: { type: 'user', id: olgaId },
      permissionSet: 'all-quotes',
    });
    const create = (ids: string[]) =>
      systemKeys.create(olgaId, {
        name: 'chosen',
        expiresInDays: 30,
        permissions: view({ type: 'records', ids }),
      });
    restriction = ['q1'];
    try {
      await expect(create(['q1', 'q2'])).rejects.toMatchObject({
        code: 'KEY_SCOPE_EXCEEDS_YOURS',
      });
      await expect(create(['q1'])).resolves.toBeDefined();
    } finally {
      restriction = undefined;
    }
    // The records to choose from are searched and paged by the database.
    await database
      .connection()
      .query.insertInto('quotes')
      .values(
        Array.from({ length: 60 }, (_, index) => ({
          id: `p-${String(index + 1).padStart(3, '0')}`,
          title: `Page ${String(index + 1).padStart(3, '0')}`,
          ownerId: null,
        })),
      )
      .execute();
    const olga = await keys.identityOf(olgaId);
    const list = (input: { search?: string; page?: number }) =>
      keys.scopeRecords(olga, {
        resource: 'shop.quotes',
        action: 'view',
        scope: 'quote',
        ...input,
      });
    const first = await list({});
    expect(first.records).toHaveLength(50);
    expect(first.hasMore).toBe(true);
    const second = await list({ page: 2 });
    expect(second.hasMore).toBe(false);
    expect(
      new Set([...first.records, ...second.records].map((record) => record.id))
        .size,
    ).toBe(first.records.length + second.records.length);
    expect((await list({ search: 'page 058' })).records).toEqual([
      { id: 'p-058', title: 'Page 058' },
    ]);
  });
});
