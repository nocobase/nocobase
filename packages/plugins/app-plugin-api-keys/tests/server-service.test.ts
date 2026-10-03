// @vitest-environment node
import { fileURLToPath } from 'node:url';
import { createMigrator, type DatabaseManager } from '@nocobase/db';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { Auth } from '@nocobase/app-plugin-authentication/server';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiKey, ApiKeyService } from '../server/index.js';

let testDatabase: TestDatabase;
let database: DatabaseManager;
let auth: Auth;
beforeEach(async () => {
  testDatabase = await createTestDatabase();
  database = testDatabase.database;
  for (const [packageName, directory] of [
    ['authentication', '../../app-plugin-authentication/database/migrations'],
    ['api-keys', '../database/migrations'],
  ])
    await createMigrator({
      database,
      packageName: `@nocobase/app-plugin-${packageName}`,
      directory: fileURLToPath(new URL(directory!, import.meta.url)),
    }).latest();
  auth = new Auth({
    connection: database.connection(),
    secret: 'test-only-service-secret-at-least-32-characters',
    baseURL: 'http://localhost:3000',
    plugins: [
      apiKey([
        { configId: 'default' },
        {
          configId: 'integration',
          enableSessionForAPIKeys: false,
          permissions: { defaultPermissions: { release: ['read'] } },
        },
      ]),
    ],
  });
  const now = new Date();
  await database
    .connection()
    .query.insertInto('user')
    .values({
      id: 'owner',
      name: 'Owner',
      email: 'owner@example.com',
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    })
    .execute();
});
afterEach(async () => {
  await testDatabase.destroy();
});

describe('configuration-bound server API key management', () => {
  it('uses Better Auth credentials and rejects other configurations without mutating them', async () => {
    const service = new ApiKeyService(auth, 'integration');
    const other = new ApiKeyService(auth, 'default');
    const created = await service.create({
      userId: 'owner',
      name: 'Integration',
    });
    expect(
      await database
        .connection()
        .query.selectFrom('apikey')
        .select('configId')
        .where('id', '=', created.key.id)
        .executeTakeFirst(),
    ).toEqual({ configId: 'integration' });
    expect(await service.verify(created.secret)).toMatchObject({
      id: created.key.id,
      configId: 'integration',
    });
    expect(await other.verify(created.secret)).toBeNull();
    expect(await other.get(created.key.id)).toBeNull();
    await other.disable(created.key.id);
    await other.remove(created.key.id);
    expect((await service.get(created.key.id))?.enabled).toBe(true);
    expect(JSON.stringify(created.key)).not.toContain(created.secret);
    expect(created.key).not.toHaveProperty('key');
    expect((await service.get(created.key.id))?.permissions).toEqual(
      created.key.permissions,
    );
    expect((await service.verify(created.secret))?.permissions).toEqual(
      created.key.permissions,
    );
    await service.disable(created.key.id);
    await service.disable(created.key.id);
    expect(await service.verify(created.secret)).toBeNull();
    await service.remove(created.key.id);
    await service.remove(created.key.id);
    expect(await service.get(created.key.id)).toBeNull();
  });
  it('fails closed on missing configurations', async () => {
    await expect(
      new ApiKeyService(auth, 'missing').create({
        userId: 'owner',
        name: 'Missing',
      }),
    ).rejects.toThrow('not registered');
  });
});

describe('formal authentication dispatch', () => {
  it('runs configured hooks for server calls and rolls back credentials with the caller transaction', async () => {
    const before = vi.fn();
    const after = vi.fn();
    const guarded = new Auth({
      connection: database.connection(),
      secret: 'test-only-service-secret-at-least-32-characters',
      baseURL: 'http://localhost:3000',
      plugins: [apiKey()],
      hooks: {
        before: createAuthMiddleware((ctx) => {
          before(ctx.path);
          if (ctx.body?.name === 'Blocked')
            throw APIError.from('FORBIDDEN', { message: 'Blocked by hook' });
        }),
        after: createAuthMiddleware((ctx) => {
          after(ctx.path);
        }),
      },
    });
    const service = new ApiKeyService(guarded, 'default');
    await expect(
      service.create({ userId: 'owner', name: 'Blocked' }),
    ).rejects.toThrow('Blocked by hook');
    await expect(
      database.transaction(async (connection) => {
        await service
          .withConnection(connection)
          .create({ userId: 'owner', name: 'Rollback' });
        throw new Error('Rollback requested');
      }),
    ).rejects.toThrow('Rollback requested');
    expect(
      await database
        .connection()
        .query.selectFrom('apikey')
        .select('id')
        .execute(),
    ).toEqual([]);
    await service.create({ userId: 'owner', name: 'Kept' });
    expect(before).toHaveBeenCalledWith('/api-key/create');
    expect(after).toHaveBeenCalledWith('/api-key/create');
    expect(
      await database
        .connection()
        .query.selectFrom('apikey')
        .select('id')
        .execute(),
    ).toHaveLength(1);
  });
});
