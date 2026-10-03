import { fileURLToPath } from 'node:url';

import {
  createAppAuthorization,
  type Authorization,
} from '@nocobase/app-plugin-authorization';
import {
  createMigrator,
  type DatabaseConnection,
  type DatabaseManager,
} from '@nocobase/db';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PermissionSetLastAssignmentError,
  type PermissionSetsAuthorizationApi,
} from '@nocobase/authorization/permission-sets';

import {
  createHubUserRoleScope,
  HUB_ADMINISTRATOR,
  protectHubPermissionSets,
} from '../server/authorization.js';

describe('Hub user role scope', () => {
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
    // The Hub's API key table references the api-keys plugin's table, which an
    // application creates before the Hub's migrations run.
    await migratePackage(
      database,
      '@nocobase/app-plugin-api-keys',
      '../../app-plugin-api-keys/database/migrations',
    );
    await migratePackage(
      database,
      '@nocobase/app-plugin-hub',
      '../database/migrations',
    );
    // The Hub declares its own protections, so Permission Sets is the only
    // plugin these tests drive.
    authorization = createAppAuthorization({
      connection: database.connection(),
    });
    // What HubAuthorizationProvider declares at runtime.
    protectHubPermissionSets(authorization.permissionSets);
    // What UsersProvider declares at runtime: a disabled account no longer
    // counts as an active assignment. Without it every assignment counts, and
    // whether a disabled administrator still protects the last one would
    // depend on which concurrent transaction takes the lock first.
    authorization.subjects.add<DatabaseConnection>('user', {
      filterActive: async (ids, connection) =>
        ids.length === 0
          ? []
          : (
              await (connection ?? database.connection()).query
                .selectFrom('user')
                .select('id')
                .where('id', 'in', [...ids])
                .where('disabledAt', 'is', null)
                .execute()
            ).map((row) => String(row.id)),
    });
  });

  afterEach(async () => {
    await testDatabase.destroy();
  });

  it('leaves ownership and existing Apps unchanged when migrations run again', async () => {
    await database
      .query()
      .insertInto('hubApps')
      .values({
        id: 'owned',
        name: 'Owned',
        createdBy: 'user-1',
        enabled: false,
        basePath: '/owned',
        backend: 'in-process',
        startupMode: 'lazy',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();
    const directory = '../database/migrations';
    const migrator = createMigrator({
      database,
      packageName: '@nocobase/app-plugin-hub',
      directory: fileURLToPath(new URL(directory, import.meta.url)),
    });
    expect((await migrator.latest()).executed).toEqual([]);
    expect((await migrator.latest()).executed).toEqual([]);
    expect(
      await database
        .query()
        .selectFrom('hubApps')
        .select(['id', 'createdBy'])
        .execute(),
    ).toEqual([{ id: 'owned', createdBy: 'user-1' }]);
  });

  it('keeps exactly one Hub role without touching other Permission Sets', async () => {
    await createUser(database, 'user-1');
    await authorization.permissionSets.create({
      key: 'other-role',
      grants: [],
    });
    await authorization.permissionSets.assign({
      subject: { type: 'user', id: 'user-1' },
      permissionSet: 'hub-operator',
    });
    await authorization.permissionSets.assign({
      subject: { type: 'user', id: 'user-1' },
      permissionSet: 'other-role',
    });
    const scope = createHubUserRoleScope(authorization.permissionSets);

    await database.transaction((connection) =>
      scope.replace('user-1', 'hub-administrator', connection),
    );

    const assignments = await authorization.permissionSets.listAssignments();
    expect(
      assignments
        .filter(({ subject }) => subject.id === 'user-1')
        .map(({ permissionSet }) => permissionSet)
        .sort(),
    ).toEqual(['hub-administrator', 'other-role']);
    await expect(
      database.transaction((connection) =>
        scope.replace('user-1', 'unknown-role', connection),
      ),
    ).rejects.toMatchObject({ code: 'INVALID_ROLE_SCOPE_VALUE' });
    await expect(
      database.transaction((connection) =>
        scope.replace(
          'user-1',
          ['hub-administrator', 'hub-operator'],
          connection,
        ),
      ),
    ).rejects.toMatchObject({ code: 'INVALID_ROLE_SCOPE_VALUE' });
  });

  it('exposes localized labels for the Hub role scope and options', async () => {
    const scope = createHubUserRoleScope(authorization.permissionSets);

    await expect(scope.options()).resolves.toEqual([
      expect.objectContaining({
        value: 'hub-administrator',
        labelI18nKey: 'roles.names.hub-administrator',
        labelI18nNs: '@nocobase/app-plugin-hub',
      }),
      expect.objectContaining({
        value: 'hub-operator',
        labelI18nKey: 'roles.names.hub-operator',
        labelI18nNs: '@nocobase/app-plugin-hub',
      }),
    ]);
    expect(scope).toMatchObject({
      labelI18nKey: 'roles.scope',
      labelI18nNs: '@nocobase/app-plugin-hub',
    });
  });

  it('rejects the removed Viewer role like any other unknown role', async () => {
    await createUser(database, 'user-1');
    const scope = createHubUserRoleScope(authorization.permissionSets);

    expect((await scope.options()).map((option) => option.value)).toEqual([
      'hub-administrator',
      'hub-operator',
    ]);
    await expect(
      database.transaction((connection) =>
        scope.replace('user-1', 'hub-viewer', connection),
      ),
    ).rejects.toMatchObject({ code: 'INVALID_ROLE_SCOPE_VALUE' });
  });

  it('loads one page of Hub roles through one batch read', async () => {
    await createUser(database, 'user-1');
    await createUser(database, 'user-2');
    await authorization.permissionSets.assign({
      subject: { type: 'user', id: 'user-1' },
      permissionSet: 'hub-operator',
    });
    const listAssignments = vi.spyOn(
      authorization.permissionSets,
      'listAssignments',
    );
    vi.spyOn(authorization.permissionSets, 'withTransaction').mockReturnValue(
      authorization.permissionSets,
    );
    const scope = createHubUserRoleScope(authorization.permissionSets);

    await expect(
      scope.getMany?.(['user-1', 'user-2'], database.connection()),
    ).resolves.toEqual({
      'user-1': 'hub-operator',
      'user-2': '',
    });
    expect(listAssignments).toHaveBeenCalledTimes(1);
  });

  it('protects the last enabled Hub administrator', async () => {
    await createUser(database, 'admin-1');
    await authorization.permissionSets.assign({
      subject: { type: 'user', id: 'admin-1' },
      permissionSet: HUB_ADMINISTRATOR,
    });
    const scope = createHubUserRoleScope(authorization.permissionSets);

    await expect(assertRemovable('admin-1')).rejects.toBeInstanceOf(
      PermissionSetLastAssignmentError,
    );
    await expect(
      database.transaction((connection) =>
        scope.replace('admin-1', 'hub-operator', connection),
      ),
    ).rejects.toBeInstanceOf(PermissionSetLastAssignmentError);
  });

  it('allows one administrator to be disabled or demoted when another is enabled', async () => {
    await createUser(database, 'admin-1');
    await createUser(database, 'admin-2');
    for (const userId of ['admin-1', 'admin-2']) {
      await authorization.permissionSets.assign({
        subject: { type: 'user', id: userId },
        permissionSet: HUB_ADMINISTRATOR,
      });
    }
    const scope = createHubUserRoleScope(authorization.permissionSets);

    await expect(assertRemovable('admin-1')).resolves.toBeUndefined();
    await database.transaction((connection) =>
      scope.replace('admin-1', 'hub-operator', connection),
    );
    await expect(assertRemovable('admin-2')).rejects.toBeInstanceOf(
      PermissionSetLastAssignmentError,
    );
  });

  it('keeps one enabled administrator when demotion and disable compete', async () => {
    await createUser(database, 'admin-1');
    await createUser(database, 'admin-2');
    for (const userId of ['admin-1', 'admin-2']) {
      await authorization.permissionSets.assign({
        subject: { type: 'user', id: userId },
        permissionSet: HUB_ADMINISTRATOR,
      });
    }
    const scope = createHubUserRoleScope(authorization.permissionSets);

    const results = await Promise.allSettled([
      database.transaction((connection) =>
        scope.replace('admin-1', 'hub-operator', connection),
      ),
      database.transaction(async (connection) => {
        await authorization.permissionSets
          .withTransaction(connection)
          .assertSubjectRemovable({ type: 'user', id: 'admin-2' });
        await connection.query
          .updateTable('user')
          .set({ disabledAt: new Date() })
          .where('id', '=', 'admin-2')
          .execute();
      }),
    ]);

    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    const failures = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    expect(failures).toHaveLength(1);
    expect(failures[0]?.reason).toBeInstanceOf(
      PermissionSetLastAssignmentError,
    );
    const enabledAdministrators = await database
      .connection()
      .query.selectFrom('authorizationPermissionSetAssignments')
      .innerJoin(
        'user',
        'user.id',
        'authorizationPermissionSetAssignments.subjectId',
      )
      .select('authorizationPermissionSetAssignments.subjectId')
      .where('authorizationPermissionSetAssignments.subjectType', '=', 'user')
      .where(
        'authorizationPermissionSetAssignments.permissionSetKey',
        '=',
        HUB_ADMINISTRATOR,
      )
      .where('user.disabledAt', 'is', null)
      .execute();
    expect(enabledAdministrators).toHaveLength(1);
  });

  /** What the user management service asks before disabling an account. */
  function assertRemovable(userId: string): Promise<void> {
    return database.transaction((connection) =>
      authorization.permissionSets
        .withTransaction(connection)
        .assertSubjectRemovable({ type: 'user', id: userId }),
    );
  }
});

async function migratePackage(
  database: DatabaseManager,
  packageName: string,
  directory: string,
) {
  await createMigrator({
    database,
    packageName,
    directory: fileURLToPath(new URL(directory, import.meta.url)),
  }).latest();
}

async function createUser(database: DatabaseManager, id: string) {
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
}
