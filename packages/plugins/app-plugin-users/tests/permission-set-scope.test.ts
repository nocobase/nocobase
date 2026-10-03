import { fileURLToPath } from 'node:url';

import {
  createAppAuthorization,
  type Authorization,
} from '@nocobase/app-plugin-authorization';
import type { PermissionSetsAuthorizationApi } from '@nocobase/authorization/permission-sets';
import { createMigrator, type DatabaseManager } from '@nocobase/db';
import { createTestDatabase, type TestDatabase } from '@nocobase/db-testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createApplicationUserRoleScope } from '../server/services/permission-set-scope.js';

describe('built-in user permission-set scope', () => {
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
    // The two code-owned sets the plugin names, which is what the role picker
    // has to leave alone.
    authorization = createAppAuthorization({
      connection: database.connection(),
    });
    await authorization.permissionSets.create({
      key: 'root',
      title: {
        key: 'permissionSets.builtIn.root',
        ns: '@nocobase/app-plugin-authorization',
      },
      grants: [],
    });
    await authorization.permissionSets.create({
      key: 'member',
      title: 'Member',
      grants: [],
    });
    await authorization.permissionSets.assign({
      subject: { type: 'authenticated', id: '*' },
      permissionSet: 'member',
    });
    await authorization.permissionSets.create({
      key: 'content-editor',
      title: 'Content editor',
      grants: [],
    });
    await authorization.permissionSets.create({
      key: 'plugin-internal',
      title: 'Plugin internal',
      grants: [],
    });
    // The root and member sets are already protected by the plugin;
    // this stands in for another plugin's own set.
    authorization.permissionSets.protect({
      owner: '@nocobase/test',
      keys: ['plugin-internal'],
    });
  });

  afterEach(async () => {
    await testDatabase.destroy();
  });

  it('shows direct application roles but not authenticated defaults or other protected sets', async () => {
    const scope = createApplicationUserRoleScope(authorization.permissionSets);

    await expect(scope.options()).resolves.toEqual([
      {
        value: 'content-editor',
        label: 'Content editor',
      },
      {
        value: 'root',
        label: 'permissionSets.builtIn.root',
        labelI18nKey: 'permissionSets.builtIn.root',
        labelI18nNs: '@nocobase/app-plugin-authorization',
        assignable: false,
        removable: false,
      },
    ]);
    expect(scope).toMatchObject({
      key: 'app',
      labelI18nKey: 'page.roles',
      labelI18nNs: '@nocobase/app-plugin-users',
      selection: 'multiple',
      hasAuthenticatedDefaultAccess: true,
    });
  });

  it('replaces custom roles while preserving authenticated defaults', async () => {
    await createUser(database, 'user-1');
    await authorization.permissionSets.assign({
      subject: { type: 'user', id: 'user-1' },
      permissionSet: 'member',
    });
    const scope = createApplicationUserRoleScope(authorization.permissionSets);

    await database.transaction((connection) =>
      scope.replace('user-1', ['content-editor'], connection),
    );

    await expect(scope.get('user-1', database.connection())).resolves.toEqual([
      'content-editor',
    ]);
    await expect(
      scope.findUserIds('content-editor', database.connection()),
    ).resolves.toEqual(['user-1']);
    expect(
      (await authorization.permissionSets.listAssignments())
        .filter(({ subject }) => subject.id === 'user-1')
        .map(({ permissionSet }) => permissionSet)
        .sort(),
    ).toEqual(['content-editor', 'member']);
  });

  it('rejects changes to the protected system administrator assignment', async () => {
    await createUser(database, 'admin-1');
    await createUser(database, 'user-1');
    await authorization.permissionSets.assign({
      subject: { type: 'user', id: 'admin-1' },
      permissionSet: 'root',
    });
    const scope = createApplicationUserRoleScope(authorization.permissionSets);

    await expect(
      database.transaction((connection) =>
        scope.replace('admin-1', [], connection),
      ),
    ).rejects.toMatchObject({ code: 'PROTECTED_ROLE_ASSIGNMENT', status: 409 });
    await expect(
      database.transaction((connection) =>
        scope.replace('user-1', ['root'], connection),
      ),
    ).rejects.toMatchObject({ code: 'PROTECTED_ROLE_ASSIGNMENT', status: 409 });
  });

  it('protects the root set the application configured', async () => {
    const configured = createAppAuthorization({
      connection: database.connection(),
      config: { permissionSets: { rootSet: 'owner' } },
    });
    await configured.permissionSets.create({
      key: 'owner',
      title: 'Owner',
      grants: [],
    });
    await createUser(database, 'owner-1');
    await configured.permissionSets.assign({
      subject: { type: 'user', id: 'owner-1' },
      permissionSet: 'owner',
    });
    const scope = createApplicationUserRoleScope(configured.permissionSets);

    await expect(scope.options()).resolves.toEqual(
      expect.arrayContaining([
        {
          value: 'owner',
          label: 'Owner',
          assignable: false,
          removable: false,
        },
      ]),
    );
    await expect(
      database.transaction((connection) =>
        scope.replace('owner-1', [], connection),
      ),
    ).rejects.toMatchObject({ code: 'PROTECTED_ROLE_ASSIGNMENT', status: 409 });
  });

  it('manages every set the application did not name as its root set', async () => {
    const unprotected = createAppAuthorization({
      connection: database.connection(),
      config: { permissionSets: { rootSet: 'owner' } },
    });
    await createUser(database, 'admin-1');
    await unprotected.permissionSets.assign({
      subject: { type: 'user', id: 'admin-1' },
      permissionSet: 'root',
    });
    const scope = createApplicationUserRoleScope(unprotected.permissionSets);

    // The root set named here is another key, so every listed set is assignable.
    await expect(scope.options()).resolves.toEqual([
      { value: 'content-editor', label: 'Content editor' },
      { value: 'plugin-internal', label: 'Plugin internal' },
      {
        value: 'root',
        label: 'permissionSets.builtIn.root',
        labelI18nKey: 'permissionSets.builtIn.root',
        labelI18nNs: '@nocobase/app-plugin-authorization',
      },
    ]);
    await database.transaction((connection) =>
      scope.replace('admin-1', ['content-editor'], connection),
    );
    expect(
      (await unprotected.permissionSets.listAssignments())
        .filter(({ subject }) => subject.id === 'admin-1')
        .map(({ permissionSet }) => permissionSet)
        .sort(),
    ).toEqual(['content-editor']);
  });
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
