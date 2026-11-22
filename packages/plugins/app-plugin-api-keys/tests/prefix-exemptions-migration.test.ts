import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { createMigrator, type Migrator } from '@nocobase/db';
import { afterEach, describe, expect, it } from 'vitest';

import migration from '../database/migrations/202611220004_api_keys_prefix_exemptions.js';

const require = createRequire(import.meta.url);
const migrations = (packageName: string) =>
  path.join(
    path.dirname(require.resolve(`${packageName}/package.json`)),
    'database/migrations',
  );

/** A database with the authentication (and, unless left out, authorization) plugin's tables, and the API keys migrator. */
async function database(
  withAuthorization = true,
  withAuthentication = true,
): Promise<{
  created: TestDatabase;
  apiKeys: Migrator;
}> {
  const created = await createTestDatabase();
  for (const packageName of [
    ...(withAuthentication ? ['@nocobase/app-plugin-authentication'] : []),
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
    await apiKeys.upTo('202611220003_api_keys_manager_notices');
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
    await apiKeys.upTo('202611220003_api_keys_manager_notices');
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
      '202611220004_api_keys_prefix_exemptions',
    ]);
    await apiKeys.latest();
    expect(await listed(created)).toEqual(['system-key-sales']);
  });

  it('refuses to roll back while it holds a name whose role was deleted, keeping the name reserved', async () => {
    const { created, apiKeys } = await database();
    testDatabase = created;
    await role(created, 'system-key-sales');
    await role(created, 'system-key-support');
    await apiKeys.upTo('202611220003_api_keys_manager_notices');
    await apiKeys.latest();
    expect(await listed(created)).toEqual([
      'system-key-sales',
      'system-key-support',
    ]);
    // The application deletes one of its old roles: only the list remembers its name now.
    await created.database
      .connection()
      .query.deleteFrom('authorizationPermissionSets')
      .where('key', '=', 'system-key-sales')
      .execute();
    await expect(apiKeys.rollback()).rejects.toThrow(
      /would forget 1 name\(s\).*system-key-sales/u,
    );
    expect(await listed(created)).toEqual([
      'system-key-sales',
      'system-key-support',
    ]);
    // Applying again changes nothing: the migration stays applied.
    await apiKeys.latest();
    expect(await listed(created)).toEqual([
      'system-key-sales',
      'system-key-support',
    ]);
  });

  it('refuses to roll back while a listed role’s name now matches a service account, keeping the role exempt', async () => {
    const { created, apiKeys } = await database();
    testDatabase = created;
    await role(created, 'system-key-sales');
    await apiKeys.latest();
    expect(await listed(created)).toEqual(['system-key-sales']);
    // A service account whose id is the role's suffix appears later: applying again would take the role for its set.
    await serviceAccount(created, 'sales');
    await expect(apiKeys.rollback()).rejects.toThrow(
      /would forget 1 name\(s\).*system-key-sales/u,
    );
    expect(await listed(created)).toEqual(['system-key-sales']);
    await apiKeys.latest();
    expect(await listed(created)).toEqual(['system-key-sales']);
  });

  it('keeps the list when the roles cannot be read, saying why', async () => {
    const { created, apiKeys } = await database();
    testDatabase = created;
    await role(created, 'system-key-sales');
    await apiKeys.latest();
    // Reading the roles fails, as on a lost connection: nothing can be checked.
    const real = created.database.connection().query;
    const lost = new Error('connection lost');
    const query = new Proxy(real, {
      get(target, property, receiver) {
        if (property === 'selectFrom')
          return (table: string) => {
            if (table === 'authorizationPermissionSets') throw lost;
            return target.selectFrom(table as never);
          };
        return Reflect.get(target, property, receiver) as unknown;
      },
    });
    const failure = await migration
      .down({
        builder: undefined,
        query,
        repository: (name: string) =>
          created.database.connection().repository(name),
      } as never)
      .then(
        () => undefined,
        (error: unknown) => error,
      );
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).cause).toBe(lost);
    expect(String(failure)).toMatch(
      /Could not check .*so its list is kept: connection lost/u,
    );
    expect(await listed(created)).toEqual(['system-key-sales']);
  });

  it('rolls back what it listed without the users’ Collection, checking service accounts exactly as it listed', async () => {
    // Roles, but no authentication plugin: `up` cannot check service accounts, and `down` does not either.
    const { created, apiKeys } = await database(true, false);
    testDatabase = created;
    await role(created, 'system-key-sales');
    await apiKeys.upTo('202611220003_api_keys_manager_notices');
    await apiKeys.latest();
    expect(await listed(created)).toEqual(['system-key-sales']);
    expect((await apiKeys.rollback()).rolledBack).toEqual([
      '202611220004_api_keys_prefix_exemptions',
    ]);
    await apiKeys.latest();
    expect(await listed(created)).toEqual(['system-key-sales']);
  });

  it('keeps the list when it cannot find out whether the users’ Collection exists, saying why', async () => {
    const { created, apiKeys } = await database();
    testDatabase = created;
    await role(created, 'system-key-sales');
    await apiKeys.latest();
    const lost = new Error('connection lost');
    const failure = await migration
      .down({
        builder: undefined,
        query: created.database.connection().query,
        repository: (name: string) =>
          name === 'user'
            ? {
                count: () => Promise.reject(lost),
              }
            : created.database.connection().repository(name),
      } as never)
      .then(
        () => undefined,
        (error: unknown) => error,
      );
    expect((failure as Error).cause).toBe(lost);
    expect(String(failure)).toMatch(/so its list is kept: connection lost/u);
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
