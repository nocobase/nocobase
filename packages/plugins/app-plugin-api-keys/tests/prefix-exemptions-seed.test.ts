import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { createMigrator } from '@nocobase/db';
import { afterEach, describe, expect, it } from 'vitest';

import seed from '../database/seeds/202611210005_api_keys_prefix_exemptions.js';

const require = createRequire(import.meta.url);
const migrations = (packageName: string) =>
  path.join(
    path.dirname(require.resolve(`${packageName}/package.json`)),
    'database/migrations',
  );

async function database(withAuthorization = true): Promise<TestDatabase> {
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
  await createMigrator({
    database: created.database,
    packageName: '@nocobase/app-plugin-api-keys',
    directory: fileURLToPath(
      new URL('../database/migrations', import.meta.url),
    ),
  }).latest();
  return created;
}

describe('the seed listing roles already named in the prefix reserved for system keys', () => {
  let testDatabase: TestDatabase | undefined;
  const now = new Date();

  afterEach(async () => {
    await testDatabase?.destroy();
    testDatabase = undefined;
  });

  const run = (created: TestDatabase) =>
    seed.run({
      query: created.database.connection().query,
      repository: (name: string) =>
        created.database.connection().repository(name),
    } as never);
  const listed = async (created: TestDatabase) =>
    (
      await created.database
        .connection()
        .query.selectFrom('apiKeyPrefixExemptions')
        .select(['permissionSetKey'])
        .orderBy('permissionSetKey')
        .execute()
    ).map((row) => String(row.permissionSetKey));

  it('lists the roles in the prefix once, never a system key’s set or a role outside it', async () => {
    testDatabase = await database();
    const { query } = testDatabase.database.connection();
    for (const key of [
      'system-key-sales',
      'system-key-42',
      'system-keys-board',
      'SYSTEM-KEY-upper',
      'member',
    ])
      await query
        .insertInto('authorizationPermissionSets')
        .values({
          id: `app-${key}`,
          key,
          title: key,
          grants: '[]',
          createdAt: now,
          updatedAt: now,
        })
        .execute();
    await query
      .insertInto('apiKeySystemKeys')
      .values({
        identityId: '42',
        keyId: 'key-42',
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    await run(testDatabase);
    await run(testDatabase);
    expect(await listed(testDatabase)).toEqual(['system-key-sales']);
  });

  it('lists nothing without the authorization plugin’s roles', async () => {
    testDatabase = await database(false);
    await expect(run(testDatabase)).resolves.toBeUndefined();
    expect(await listed(testDatabase)).toEqual([]);
  });
});
