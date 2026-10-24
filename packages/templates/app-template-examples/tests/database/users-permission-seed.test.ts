import type { DatabaseManager } from '@nocobase/db';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import seed from '../../database/main/seeds/202609160001_grant_system_administrator_user_management.js';

describe('examples application user management permission seed', () => {
  let testDatabase: TestDatabase;
  let database: DatabaseManager;

  beforeEach(async () => {
    testDatabase = await createTestDatabase();
    database = testDatabase.database;
  });

  async function createPermissionSetTable(): Promise<void> {
    await database
      .connection()
      .builder.createCollection('authorizationPermissionSets', (collection) => {
        collection.string('key').primary();
        collection.json('grants').notNull();
        collection.datetime('updatedAt').notNull();
      });
  }

  afterEach(async () => {
    await testDatabase?.destroy();
  });

  it('adds every user management action once and preserves other grants', async () => {
    await createPermissionSetTable();
    const query = database.connection().query;
    await query
      .insertInto('authorizationPermissionSets')
      .values({
        key: 'system-administrator',
        grants: JSON.stringify([
          {
            resource: { type: 'page', id: '*' },
            actions: [{ action: 'access' }],
          },
          {
            resource: { type: 'user', id: '*' },
            actions: [{ action: 'read' }],
          },
        ]),
        updatedAt: new Date(),
      })
      .execute();

    await seed.run({ query, connection: database.connection() });
    await seed.run({ query, connection: database.connection() });

    const row = await query
      .selectFrom('authorizationPermissionSets')
      .select('grants')
      .where('key', '=', 'system-administrator')
      .executeTakeFirstOrThrow();
    expect(jsonValue(row.grants)).toEqual([
      {
        resource: { type: 'page', id: '*' },
        actions: [{ action: 'access' }],
      },
      {
        resource: { type: 'user', id: '*' },
        actions: [
          { action: 'read' },
          { action: 'create' },
          { action: 'update' },
          { action: 'disable' },
          { action: 'enable' },
          { action: 'assign-role' },
          { action: 'reset-password' },
          { action: 'revoke-sessions' },
        ],
      },
    ]);
  });

  it('does nothing before Authorization creates the system administrator', async () => {
    await createPermissionSetTable();
    await expect(
      seed.run({
        query: database.connection().query,
        connection: database.connection(),
      }),
    ).resolves.toBeUndefined();
  });

  it('does nothing when Authorization is not installed', async () => {
    await expect(
      seed.run({
        query: database.connection().query,
        connection: database.connection(),
      }),
    ).resolves.toBeUndefined();
  });
});

function jsonValue(value: unknown): unknown {
  return typeof value === 'string' ? JSON.parse(value) : value;
}
