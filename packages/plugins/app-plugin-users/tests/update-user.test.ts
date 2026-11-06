import { fileURLToPath } from 'node:url';
import type {
  AdministratedUser,
  UserAdministrationService,
} from '@nocobase/app-plugin-authentication';
import { createAppAuthorization } from '@nocobase/app-plugin-authorization';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { createMigrator, type DatabaseConnection } from '@nocobase/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createUserManagementService,
  createUserRoleScopeRegistry,
} from '../server/services/users.js';
import { createApplicationUserRoleScope } from '../server/services/permission-set-scope.js';
import {
  UserRoleScopeError,
  type UserManagementService,
} from '../server/tokens.js';

// Real profile and Permission Set writes prove the transaction boundary; the fixture
// leaves Authentication's own identity validation to that package's integration tests.
describe('atomic user profile and role updates', () => {
  let fixture: TestDatabase;
  let service: UserManagementService;
  let rejectLateScope: boolean;
  let rejectAssignment: boolean;
  const changed = vi.fn();
  const guards = vi.fn();
  const now = new Date();

  beforeEach(async () => {
    fixture = await createTestDatabase();
    for (const [packageName, directory] of [
      [
        '@nocobase/app-plugin-authentication',
        '../../app-plugin-authentication/database/migrations',
      ],
      [
        '@nocobase/app-plugin-authorization',
        '../../app-plugin-authorization/database/migrations',
      ],
    ])
      await createMigrator({
        database: fixture.database,
        packageName: packageName!,
        directory: fileURLToPath(new URL(directory!, import.meta.url)),
      }).latest();
    const connection = fixture.database.connection();
    for (const id of ['alice', 'other'])
      await connection.query
        .insertInto('user')
        .values({
          id,
          name: id,
          email: `${id}@example.test`,
          emailVerified: true,
          disabledAt: null,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
    const authorization = createAppAuthorization({ connection });
    for (const key of ['viewer', 'editor'])
      await authorization.permissionSets.create({
        key,
        title: key,
        grants: [],
      });
    await authorization.permissionSets.assign({
      permissionSet: 'viewer',
      subject: { type: 'user', id: 'alice' },
    });
    await authorization.permissionSets.assign({
      permissionSet: 'viewer',
      subject: { type: 'user', id: 'other' },
    });
    const registry = createUserRoleScopeRegistry();
    registry.register(
      createApplicationUserRoleScope(authorization.permissionSets),
    );
    rejectLateScope = false;
    rejectAssignment = false;
    changed.mockClear();
    guards.mockClear();
    registry.register({
      key: 'department',
      label: 'Department',
      selection: 'multiple',
      options: () => Promise.resolve([]),
      get: () => Promise.resolve([]),
      findUserIds: () => Promise.resolve([]),
      replace: async () => {
        if (rejectLateScope)
          throw new UserRoleScopeError(
            'TEST_REFUSAL',
            'The scope refused the change',
          );
      },
      assertCanAdminister: async (_userId, _actorId, action) => {
        guards(action);
        if (action === 'assign-role' && rejectAssignment)
          throw new UserRoleScopeError(
            'TEST_REFUSAL',
            'The actor cannot assign these roles',
          );
      },
    });
    service = createUserManagementService({
      database: fixture.database,
      users: accounts(connection),
      roleScopes: registry,
      onRoleScopesChanged: changed,
    });
  });
  afterEach(async () => fixture.destroy());

  it('commits both changes, preserves other users and omitted scopes, and can repeat safely', async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      expect(
        await service.update(
          'alice',
          { name: 'Alice updated', roleScopes: { app: ['editor'] } },
          'admin',
        ),
      ).toMatchObject({
        name: 'Alice updated',
        roleScopes: { app: ['editor'], department: [] },
      });
      expect(await service.get('other')).toMatchObject({
        name: 'other',
        roleScopes: { app: ['viewer'] },
      });
    }
    expect(guards.mock.calls.flat()).toEqual([
      'update',
      'assign-role',
      'update',
      'assign-role',
    ]);
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it('rolls back the profile and earlier scopes when a later scope rejects', async () => {
    rejectLateScope = true;
    await expect(
      service.update(
        'alice',
        {
          name: 'Not committed',
          roleScopes: { app: ['editor'], department: [] },
        },
        'admin',
      ),
    ).rejects.toMatchObject({ code: 'TEST_REFUSAL' });
    expect(await service.get('alice')).toMatchObject({
      name: 'alice',
      roleScopes: { app: ['viewer'] },
    });
    expect(changed).not.toHaveBeenCalled();
  });

  it('checks assign-role target guards before changing the profile', async () => {
    rejectAssignment = true;
    await expect(
      service.update(
        'alice',
        { name: 'Not committed', roleScopes: { app: ['editor'] } },
        'admin',
      ),
    ).rejects.toMatchObject({ code: 'TEST_REFUSAL' });
    expect(await service.get('alice')).toMatchObject({
      name: 'alice',
      roleScopes: { app: ['viewer'] },
    });
    expect(changed).not.toHaveBeenCalled();
  });

  it('supports role-only updates without a profile action and profile-only updates without replacing roles', async () => {
    await service.update('alice', { roleScopes: { app: ['editor'] } }, 'admin');
    expect(guards.mock.calls.flat()).toEqual(['assign-role']);
    guards.mockClear();
    expect(
      await service.update('alice', { name: 'Alice' }, 'admin'),
    ).toMatchObject({ name: 'Alice', roleScopes: { app: ['editor'] } });
    expect(guards.mock.calls.flat()).toEqual(['update']);
  });

  it.each([
    { app: ['editor', 'editor'] },
    { app: ['does-not-exist'] },
    { missingScope: [] },
    { app: 'editor' },
  ])(
    'rejects invalid scopes without changing the profile: %j',
    async (roleScopes) => {
      await expect(
        service.update('alice', { name: 'Not committed', roleScopes }, 'admin'),
      ).rejects.toThrow();
      expect(await service.get('alice')).toMatchObject({
        name: 'alice',
        roleScopes: { app: ['viewer'] },
      });
      expect(changed).not.toHaveBeenCalled();
    },
  );
});

function accounts(connection: DatabaseConnection): UserAdministrationService {
  const get = async (id: string): Promise<AdministratedUser | undefined> => {
    const row = await connection.query
      .selectFrom('user')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row
      ? {
          id,
          name: String(row.name),
          email: String(row.email),
          emailVerified: true,
          disabledAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      : undefined;
  };
  return {
    withConnection: accounts,
    get,
    update: async (
      id: string,
      input: Parameters<UserAdministrationService['update']>[1],
    ) => {
      await connection.query
        .updateTable('user')
        .set(input)
        .where('id', '=', id)
        .execute();
      return (await get(id))!;
    },
    list: vi.fn(),
    create: vi.fn(),
    disable: vi.fn(),
    enable: vi.fn(),
    resetPassword: vi.fn(),
    revokeSessions: vi.fn(),
  } as unknown as UserAdministrationService;
}
