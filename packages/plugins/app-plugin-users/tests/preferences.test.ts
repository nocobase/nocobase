// @vitest-environment node
import { fileURLToPath } from 'node:url';

import {
  authenticationToken,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { createMigrator, type DatabaseManager } from '@nocobase/db';
import { ServiceContainer } from '@nocobase/service-provider';
import type { Knex } from 'knex';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import createUserPreferences from '../database/migrations/202610020201_create_user_preferences.js';
import {
  createUserPreferencesService,
  MAX_USER_PREFERENCE_BYTES,
  type UserPreferencesService,
} from '../server/preferences/service.js';
import { apiRoutes } from '../server/routes/index.js';
import {
  userManagementServiceToken,
  userPreferencesServiceToken,
} from '../server/tokens.js';

describe('the userPreferences migration', () => {
  let testDatabase: TestDatabase;
  let database: DatabaseManager;

  beforeEach(async () => {
    testDatabase = await createTestDatabase();
    database = testDatabase.database;
  });

  afterEach(async () => {
    await testDatabase.destroy();
  });

  it('creates the table with one row per person and key, and drops it again', async () => {
    const connection = database.connection();
    const context = {
      builder: connection.builder,
      query: connection.query,
      connection,
    } as unknown as Parameters<typeof createUserPreferences.up>[0];
    await createUserPreferences.up(context);
    const client = await connection.client<Knex>();

    for (const column of [
      'id',
      'user_id',
      'key',
      'value',
      'created_at',
      'updated_at',
    ])
      await expect(
        client.schema.hasColumn('user_preferences', column),
      ).resolves.toBe(true);
    const now = new Date();
    const row = {
      user_id: 'ann',
      key: 'theme.mode',
      value: '"dark"',
      created_at: now,
      updated_at: now,
    };
    await client('user_preferences').insert({ id: 'p1', ...row });
    await expect(
      client('user_preferences').insert({ id: 'p2', ...row }),
    ).rejects.toThrow();

    await createUserPreferences.down(context);
    await expect(client.schema.hasTable('user_preferences')).resolves.toBe(
      false,
    );
  });
});

describe('user preferences', () => {
  let testDatabase: TestDatabase;
  let database: DatabaseManager;
  let service: UserPreferencesService;

  beforeEach(async () => {
    testDatabase = await createTestDatabase();
    database = testDatabase.database;
    // The invitations migration relates to authentication's `user`.
    for (const [packageName, directory] of [
      [
        '@nocobase/app-plugin-authentication',
        '../../app-plugin-authentication/database/migrations',
      ],
      ['@nocobase/app-plugin-users', '../database/migrations'],
    ] as const)
      await createMigrator({
        database,
        packageName,
        directory: fileURLToPath(new URL(directory, import.meta.url)),
      }).latest();
    service = createUserPreferencesService({ database });
  });

  afterEach(async () => {
    await testDatabase.destroy();
  });

  it('keeps each person’s values on the server, by key', async () => {
    await service.set('ann', 'theme.mode', 'dark');
    await service.set('ann', 'inbox.chime', false);
    await service.set('bob', 'theme.mode', 'light');
    await service.set('ann', 'theme.mode', 'system');

    await expect(service.list('ann')).resolves.toEqual({
      'inbox.chime': false,
      'theme.mode': 'system',
    });
    await expect(service.get('bob', 'theme.mode')).resolves.toBe('light');
    // A second service on the same database sees the same values: nothing is held in memory.
    await expect(
      createUserPreferencesService({ database }).list('ann'),
    ).resolves.toMatchObject({ 'theme.mode': 'system' });

    await service.setMany('ann', { locale: 'zh-CN', 'theme.preset': 'blue' });
    await service.remove('ann', 'inbox.chime');
    await expect(service.list('ann')).resolves.toEqual({
      locale: 'zh-CN',
      'theme.mode': 'system',
      'theme.preset': 'blue',
    });
  });

  it('refuses a bad key or a value that is not small JSON', async () => {
    await expect(service.set('ann', 'Theme', 'x')).rejects.toMatchObject({
      code: 'INVALID_PREFERENCE_KEY',
    });
    await expect(
      service.set('ann', 'notes', 'x'.repeat(MAX_USER_PREFERENCE_BYTES)),
    ).rejects.toMatchObject({ code: 'INVALID_PREFERENCE_VALUE' });
    await expect(service.set('ann', 'notes', undefined)).rejects.toMatchObject({
      code: 'INVALID_PREFERENCE_VALUE',
    });
    await expect(
      service.setMany('ann', { good: 1, 'Bad Key': 2 }),
    ).rejects.toMatchObject({ code: 'INVALID_PREFERENCE_KEY' });
    await expect(service.list('ann')).resolves.toEqual({});
  });

  it('serves only the signed-in person’s own preferences over HTTP', async () => {
    let signedIn: string | null = 'ann';
    const container = new ServiceContainer();
    container.instance(authenticationToken, {
      required: () => async (context, next) => {
        if (!signedIn) return context.json({ code: 'UNAUTHORIZED' }, 401);
        context.set('auth', { user: { id: signedIn } } as never);
        await next();
      },
    } as Auth);
    container.instance(authorizationToken, {
      middleware: () => async (_context: unknown, next: () => Promise<void>) =>
        next(),
    } as never);
    container.instance(userManagementServiceToken, {} as never);
    container.instance(userPreferencesServiceToken, service);
    const router = await apiRoutes.createRouter({
      appName: 'test',
      publicBasePath: '',
      config: {} as AppPluginApplication['config'],
      paths: {} as AppPluginApplication['paths'],
      router: {} as AppPluginApplication['router'],
      container,
    });
    const send = (method: string, path: string, body?: unknown) =>
      router.request(`/users/me/preferences${path}`, {
        method,
        headers: { 'content-type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });

    expect((await send('PUT', '/theme.mode', { value: 'dark' })).status).toBe(
      200,
    );
    expect(
      (await send('PATCH', '', { locale: 'zh-CN', 'inbox.chime': false }))
        .status,
    ).toBe(200);
    expect(await (await send('GET', '')).json()).toEqual({
      data: { 'inbox.chime': false, locale: 'zh-CN', 'theme.mode': 'dark' },
    });
    expect((await send('PUT', '/Bad', { value: 1 })).status).toBe(400);
    expect((await send('PUT', '/theme.mode', {})).status).toBe(400);

    signedIn = 'bob';
    expect(await (await send('GET', '')).json()).toEqual({ data: {} });
    signedIn = 'ann';
    expect((await send('DELETE', '/locale')).status).toBe(204);
    await expect(service.list('ann')).resolves.toEqual({
      'inbox.chime': false,
      'theme.mode': 'dark',
    });

    signedIn = null;
    expect((await send('GET', '')).status).toBe(401);
  });
});
