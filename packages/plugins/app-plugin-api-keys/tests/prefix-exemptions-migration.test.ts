import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { createMigrator, type Migrator } from '@nocobase/db';
import { afterEach, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const migrations = (packageName: string) =>
  path.join(
    path.dirname(require.resolve(`${packageName}/package.json`)),
    'database/migrations',
  );

/** A database with the authentication (and, unless left out, authorization) plugin's tables, and the API keys migrator. */
async function database(withAuthorization = true): Promise<{
  created: TestDatabase;
  apiKeys: Migrator;
}> {
  const created = await createTestDatabase();
  for (const packageName of [
    '@nocobase/app-plugin-authentication',
    ...(withAuthorization ? ['@nocobase/app-plugin-authorization'] : []),
  ])
    await createMigrator({
      database: created.database,
      packageName,
      directory: migrations(packageName),
    }).latest();
  const apiKeys = createMigrator({
    database: created.database,
    packageName: '@nocobase/app-plugin-api-keys',
    directory: fileURLToPath(
      new URL('../database/migrations', import.meta.url),
    ),
  });
  return { created, apiKeys };
}

describe('listing the roles already named in the prefix reserved for system keys', () => {
  let testDatabase: TestDatabase | undefined;
  const now = new Date();

  afterEach(async () => {
    await testDatabase?.destroy();
    testDatabase = undefined;
  });

  const listed = async (created: TestDatabase) =>
    (
      await created.database
        .connection()
        .query.selectFrom('apiKeyPrefixExemptions')
        .select(['permissionSetKey'])
        .orderBy('permissionSetKey')
        .execute()
    ).map((row) => String(row.permissionSetKey));

  const role = (created: TestDatabase, key: string) =>
    created.database
      .connection()
      .query.insertInto('authorizationPermissionSets')
      .values({
        id: `app-${key}`,
        key,
        title: key,
        grants: '[]',
        createdAt: now,
        updatedAt: now,
      })
      .execute();

  const serviceAccount = (created: TestDatabase, id: string) =>
    created.database
      .connection()
      .query.insertInto('user')
      .values({
        id,
        name: id,
        email: `${id}@service.invalid`,
        emailVerified: false,
        kind: 'service',
        createdAt: now,
        updatedAt: now,
      })
      .execute();

  it('lists the roles in the prefix when the table is made, never a system key’s set or a role outside it', async () => {
    const { created, apiKeys } = await database();
    testDatabase = created;
    for (const key of [
      'system-key-sales',
      'system-keys-board',
      'SYSTEM-KEY-upper',
      'member',
    ])
      await role(created, key);
    await apiKeys.upTo('202611210004_api_keys_manager_notices');
    // A system key registered before the list is made, and its set.
    await role(created, 'system-key-42');
    await created.database
      .connection()
      .query.insertInto('apiKeySystemKeys')
      .values({
        identityId: '42',
        keyId: 'key-42',
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    await apiKeys.latest();
    expect(await listed(created)).toEqual(['system-key-sales']);
  });

  it('lists the same roles again when the list is rolled back and made again', async () => {
    const { created, apiKeys } = await database();
    testDatabase = created;
    await role(created, 'system-key-sales');
    await apiKeys.upTo('202611210004_api_keys_manager_notices');
    await role(created, 'system-key-42');
    await created.database
      .connection()
      .query.insertInto('apiKeySystemKeys')
      .values({
        identityId: '42',
        keyId: 'key-42',
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    await apiKeys.latest();
    expect(await listed(created)).toEqual(['system-key-sales']);

    // Only the list's own migration rolls back: the system keys stay registered.
    expect((await apiKeys.rollback()).rolledBack).toEqual([
      '202611210006_api_keys_prefix_exemptions',
    ]);
    await apiKeys.latest();
    expect(await listed(created)).toEqual(['system-key-sales']);
  });

  it('tells a system key’s set by its service account after rolling back past the system keys', async () => {
    const { created, apiKeys } = await database();
    testDatabase = created;
    await role(created, 'system-key-sales');
    await apiKeys.latest();
    // A system key made after the upgrade: its set is named after its service account.
    await serviceAccount(created, 'robot-1');
    await role(created, 'system-key-robot-1');
    // Every migration of the plugin rolls back, the system keys' table with it; the roles stay.
    await apiKeys.rollback();
    await apiKeys.latest();
    expect(await listed(created)).toEqual(['system-key-sales']);
  });

  it('lists in batches, however many roles there are', async () => {
    const { created, apiKeys } = await database();
    testDatabase = created;
    // More than one batch of 200.
    const keys = Array.from(
      { length: 250 },
      (_, index) => `system-key-role-${String(index).padStart(3, '0')}`,
    );
    await created.database
      .connection()
      .query.insertInto('authorizationPermissionSets')
      .values(
        keys.map((key) => ({
          id: `app-${key}`,
          key,
          title: key,
          grants: '[]',
          createdAt: now,
          updatedAt: now,
        })),
      )
      .execute();
    await apiKeys.latest();
    expect(await listed(created)).toEqual(keys);
  });

  it('lists nothing without the authorization plugin’s roles', async () => {
    const { created, apiKeys } = await database(false);
    testDatabase = created;
    await apiKeys.latest();
    expect(await listed(created)).toEqual([]);
  });
});
