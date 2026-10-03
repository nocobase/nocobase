import { fileURLToPath } from 'node:url';

import type { UserAdministrationService } from '@nocobase/app-plugin-authentication';
import {
  createAppAuthorization,
  type Authorization,
} from '@nocobase/app-plugin-authorization';
import {
  PermissionSetLastAssignmentError,
  type PermissionSetsAuthorizationApi,
} from '@nocobase/authorization/permission-sets';
import {
  createMigrator,
  type DatabaseConnection,
  type DatabaseManager,
} from '@nocobase/db';
import { createTestDatabase, type TestDatabase } from '@nocobase/db-testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createUserManagementService,
  createUserRoleScopeRegistry,
} from '../server/services/users.js';
import type { UserManagementService } from '../server/tokens.js';

describe('disabling an account that holds a protected Permission Set', () => {
  let testDatabase: TestDatabase;
  let database: DatabaseManager;
  let authorization: Authorization & PermissionSetsAuthorizationApi;

  beforeEach(async () => {
    testDatabase = await createTestDatabase();
    database = testDatabase.database;
    await migratePackage(
      database,
      '@nocobase/app-plugin-authentication',
      '../../app-plugin-authentication/database/migrations',
    );
    await migratePackage(
      database,
      '@nocobase/app-plugin-authorization',
      '../../app-plugin-authorization/database/migrations',
    );
    // `rootSet` declares the rule these tests drive: the root set may never
    // lose its last assignment that can still act.
    authorization = createAppAuthorization({
      connection: database.connection(),
      config: { permissionSets: { rootSet: 'root' } },
    });
    await authorization.permissionSets.create({
      key: 'root',
      title: 'Root',
      grants: [],
    });
  });

  afterEach(async () => {
    await testDatabase.destroy();
  });

  it('refuses to disable the last superuser and leaves the account enabled', async () => {
    await createAdministrators(['root']);
    const service = createService(authorization.permissionSets);

    await expect(service.disable('root')).rejects.toBeInstanceOf(
      PermissionSetLastAssignmentError,
    );
    await expect(disabledAt('root')).resolves.toBeNull();
  });

  it('disables one of two superusers', async () => {
    await createAdministrators(['root', 'second']);
    const service = createService(authorization.permissionSets);

    await expect(service.disable('root')).resolves.toMatchObject({
      id: 'root',
    });
    await expect(disabledAt('root')).resolves.not.toBeNull();
  });

  it('disables normally in an application without authorization', async () => {
    await createAdministrators(['root']);
    const service = createService(undefined);

    await expect(service.disable('root')).resolves.toMatchObject({
      id: 'root',
    });
    await expect(disabledAt('root')).resolves.not.toBeNull();
  });

  function createService(
    permissionSets:
      PermissionSetsAuthorizationApi['permissionSets'] | undefined,
  ): UserManagementService {
    return createUserManagementService({
      database,
      users: userAdministration(database.connection()),
      roleScopes: createUserRoleScopeRegistry(),
      ...(permissionSets === undefined ? {} : { permissionSets }),
    });
  }

  async function createAdministrators(ids: readonly string[]): Promise<void> {
    for (const id of ids) {
      const now = new Date();
      await database
        .connection()
        .query.insertInto('user')
        .values({
          id,
          name: id,
          username: id,
          email: `${id}@example.com`,
          emailVerified: true,
          disabledAt: null,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
      await authorization.permissionSets.assign({
        subject: { type: 'user', id },
        permissionSet: 'root',
      });
    }
  }

  async function disabledAt(id: string): Promise<unknown> {
    const row = await database
      .connection()
      .query.selectFrom('user')
      .select('disabledAt')
      .where('id', '=', id)
      .executeTakeFirstOrThrow();
    return row.disabledAt ?? null;
  }
});

/** Writes the real disabledAt column through whichever connection it is given. */
function userAdministration(
  initialConnection: DatabaseConnection,
): UserAdministrationService {
  const create = (
    connection: DatabaseConnection,
  ): UserAdministrationService => ({
    withConnection: (next) => create(next),
    list: () => Promise.resolve({ items: [], total: 0, page: 1, pageSize: 20 }),
    get: () => Promise.resolve(undefined),
    create: () => Promise.reject(new Error('not used')),
    update: () => Promise.reject(new Error('not used')),
    async disable(userId) {
      const now = new Date();
      await connection.query
        .updateTable('user')
        .set({ disabledAt: now, updatedAt: now })
        .where('id', '=', userId)
        .execute();
      return {
        id: userId,
        name: userId,
        email: `${userId}@example.com`,
        emailVerified: true,
        disabledAt: now,
        createdAt: now,
        updatedAt: now,
      };
    },
    enable: () => Promise.reject(new Error('not used')),
    resetPassword: () => Promise.reject(new Error('not used')),
    revokeSessions: () => Promise.reject(new Error('not used')),
  });
  return create(initialConnection);
}

async function migratePackage(
  database: DatabaseManager,
  packageName: string,
  directory: string,
): Promise<void> {
  await createMigrator({
    database,
    packageName,
    directory: fileURLToPath(new URL(directory, import.meta.url)),
  }).latest();
}
