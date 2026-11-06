import { fileURLToPath } from 'node:url';

import type {
  AdministratedUser,
  UserAdministrationService,
} from '@nocobase/app-plugin-authentication';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { createMigrator } from '@nocobase/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createUserManagementService,
  createUserRoleScopeRegistry,
} from '../server/services/users.js';
import {
  UserRoleScopeError,
  type UserAdministrationAction,
  type UserManagementService,
  type UserRoleScope,
} from '../server/tokens.js';

/**
 * A role scope's `assertCanAdminister` guards the target of every account action that names its actor: it runs in the
 * action's transaction before anything changes, sees who acts and what they do, and is not asked when no actor is
 * named, as the application's own server-side work names none.
 */
describe('a role scope guarding the accounts it protects', () => {
  let testDatabase: TestDatabase;
  let users: UserAdministrationService;
  let asked: [string, string, UserAdministrationAction][];
  let service: UserManagementService;

  beforeEach(async () => {
    testDatabase = await createTestDatabase();
    // The service locks the account's row before acting on it.
    await createMigrator({
      database: testDatabase.database,
      packageName: '@nocobase/app-plugin-authentication',
      directory: fileURLToPath(
        new URL(
          '../../app-plugin-authentication/database/migrations',
          import.meta.url,
        ),
      ),
    }).latest();
    const now = new Date();
    for (const id of ['owner', 'member'])
      await testDatabase.database
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
    users = userAdministration();
    asked = [];
    const registry = createUserRoleScopeRegistry();
    // Only the owner changes the owner's account.
    const scope: UserRoleScope = {
      key: 'app',
      label: 'Roles',
      selection: 'multiple',
      options: () => Promise.resolve([]),
      get: () => Promise.resolve([]),
      findUserIds: () => Promise.resolve([]),
      replace: vi.fn(() => Promise.resolve()),
      assertCanAdminister(userId, actorId, action, connection) {
        // Asked inside the action's transaction.
        if (!connection) throw new Error('No transaction');
        asked.push([userId, actorId, action]);
        if (userId === 'owner' && actorId !== 'owner')
          return Promise.reject(
            new UserRoleScopeError(
              'PROTECTED_ACCOUNT',
              'Only the owner changes this account',
              409,
            ),
          );
        return Promise.resolve();
      },
    };
    registry.register(scope);
    service = createUserManagementService({
      database: testDatabase.database,
      users,
      roleScopes: registry,
    });
  });

  afterEach(() => testDatabase.destroy());

  const actions: readonly [
    UserAdministrationAction,
    (target: string, actor?: string) => Promise<unknown>,
    () => unknown,
  ][] = [
    [
      'update',
      (target, actor) => service.update(target, { name: 'Renamed' }, actor),
      () => users.update,
    ],
    [
      'disable',
      (target, actor) => service.disable(target, actor),
      () => users.disable,
    ],
    [
      'enable',
      (target, actor) => service.enable(target, actor),
      () => users.enable,
    ],
    [
      'reset-password',
      (target, actor) => service.resetPassword(target, 'secret123', actor),
      () => users.resetPassword,
    ],
    [
      'revoke-sessions',
      (target, actor) => service.revokeSessions(target, actor),
      () => users.revokeSessions,
    ],
  ];

  it.each(actions)(
    'refuses %s on a protected account before changing it',
    async (action, run, changed) => {
      await expect(run('owner', 'admin')).rejects.toMatchObject({
        code: 'PROTECTED_ACCOUNT',
      });
      expect(asked).toEqual([['owner', 'admin', action]]);
      expect(changed()).not.toHaveBeenCalled();
    },
  );

  it.each(actions)(
    'lets %s through when the scope allows the actor, and asks nothing without one',
    async (action, run, changed) => {
      await run('owner', 'owner');
      expect(asked).toEqual([['owner', 'owner', action]]);
      await run('member');
      expect(asked).toHaveLength(1);
      expect(changed()).toHaveBeenCalledTimes(2);
    },
  );

  it('guards replacing roles too', async () => {
    await expect(
      service.replaceRoleScope('owner', 'app', [], 'admin'),
    ).rejects.toMatchObject({ code: 'PROTECTED_ACCOUNT' });
    expect(asked).toEqual([['owner', 'admin', 'assign-role']]);
  });
});

/** Accounts that always exist, recording what was done to them. */
function userAdministration(): UserAdministrationService {
  const now = new Date();
  const account = (id: string): AdministratedUser => ({
    id,
    name: id,
    email: `${id}@example.com`,
    emailVerified: true,
    disabledAt: null,
    createdAt: now,
    updatedAt: now,
  });
  const service: UserAdministrationService = {
    withConnection: () => service,
    list: () => Promise.resolve({ items: [], total: 0, page: 1, pageSize: 20 }),
    get: (id) => Promise.resolve(account(id)),
    create: () => Promise.reject(new Error('not used')),
    update: vi.fn((id: string) => Promise.resolve(account(id))),
    disable: vi.fn((id: string) => Promise.resolve(account(id))),
    enable: vi.fn((id: string) => Promise.resolve(account(id))),
    resetPassword: vi.fn(() => Promise.resolve()),
    revokeSessions: vi.fn(() => Promise.resolve()),
  } as unknown as UserAdministrationService;
  return service;
}
