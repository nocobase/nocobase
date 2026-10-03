import createAuthenticationTables from '../../app-plugin-authentication/database/migrations/202608200001_create_authentication_tables.js';
import type { UserAdministrationService } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type Authorization,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import type { DatabaseConnection } from '@nocobase/db';
import { createDatabaseTest } from '@nocobase/db-testing/vitest';
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, vi } from 'vitest';

import { UsersProvider } from '../server/providers/users.js';
import { createUserManagementService } from '../server/services/users.js';
import { createUserRoleScopeRegistry } from '../server/services/users.js';
import type { UserRoleScope } from '../server/tokens.js';

const it = createDatabaseTest();

describe('@nocobase/app-plugin-users service', () => {
  it('rolls back the created user when role assignment fails', async ({
    database,
  }) => {
    await database
      .connection()
      .builder.createCollection('testManagedUsers', (collection) => {
        collection.string('id').primary();
      });

    const registry = createUserRoleScopeRegistry();
    registry.register(
      roleScope({
        replace: vi.fn(() => Promise.reject(new Error('role failed'))),
      }),
    );
    const users = administrationService(database.connection());
    const service = createUserManagementService({
      database,
      users,
      roleScopes: registry,
    });

    await expect(
      service.create({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'secret123',
        roleScopes: { test: 'operator' },
      }),
    ).rejects.toThrow('role failed');
    await expect(
      database
        .connection()
        .query.selectFrom('testManagedUsers')
        .select('id')
        .execute(),
    ).resolves.toEqual([]);
  });

  it('notifies permission consumers only after a role transaction commits', async ({
    database,
  }) => {
    await database
      .connection()
      .builder.createCollection('testManagedUsers', (collection) => {
        collection.string('id').primary();
      });

    const events: string[] = [];
    const registry = createUserRoleScopeRegistry();
    registry.register(
      roleScope({
        replace: async (_userId, _value, connection) => {
          await connection.query
            .insertInto('testManagedUsers')
            .values({ id: 'role-write' })
            .execute();
          events.push('role-write');
        },
      }),
    );
    const service = createUserManagementService({
      database,
      users: administrationService(database.connection()),
      roleScopes: registry,
      onRoleScopesChanged: async () => {
        const committed = await database
          .connection()
          .query.selectFrom('testManagedUsers')
          .select('id')
          .where('id', '=', 'role-write')
          .executeTakeFirst();
        events.push(committed ? 'notified-after-commit' : 'notified-too-early');
      },
    });

    await service.create({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'secret123',
      roleScopes: { test: 'operator' },
    });

    expect(events).toEqual(['role-write', 'notified-after-commit']);
  });

  it('rolls back a password change when Session revocation fails', async ({
    database,
  }) => {
    const connection = database.connection();
    await createAuthenticationTables.up({
      connection,
      builder: connection.builder,
      query: connection.query,
    });
    await connection.query
      .insertInto('user')
      .values({
        id: 'user-1',
        name: 'User',
        email: 'user@example.com',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();
    await database
      .connection()
      .builder.createCollection('testPasswordState', (collection) => {
        collection.string('id').primary();
        collection.string('password').notNull();
        collection.boolean('sessionActive').notNull();
      });
    await database
      .connection()
      .query.insertInto('testPasswordState')
      .values({ id: 'user-1', password: 'old-hash', sessionActive: true })
      .execute();

    const createUsers = (
      connection: DatabaseConnection,
    ): UserAdministrationService => ({
      ...administrationService(connection),
      withConnection: createUsers,
      async resetPassword() {
        await connection.query
          .updateTable('testPasswordState')
          .set({ password: 'new-hash' })
          .where('id', '=', 'user-1')
          .execute();
        throw new Error('Session revocation failed');
      },
    });
    const service = createUserManagementService({
      database,
      users: createUsers(database.connection()),
      roleScopes: createUserRoleScopeRegistry(),
    });

    await expect(
      service.resetPassword('user-1', 'new-password'),
    ).rejects.toThrow('Session revocation failed');
    await expect(
      database
        .connection()
        .query.selectFrom('testPasswordState')
        .select(['password', 'sessionActive'])
        .where('id', '=', 'user-1')
        .executeTakeFirstOrThrow(),
    ).resolves.toMatchObject({ password: 'old-hash' });
  });

  it('rejects duplicate role scope registrations and unregisters by identity', () => {
    const registry = createUserRoleScopeRegistry();
    const scope = roleScope();
    const unregister = registry.register(scope);

    expect(() => registry.register(scope)).toThrow(
      'User role scope already registered: test',
    );
    expect(registry.list()).toEqual([scope]);

    unregister();
    expect(registry.list()).toEqual([]);
  });

  it('publishes role option protections and default-access context', async ({
    database,
  }) => {
    const registry = createUserRoleScopeRegistry();
    registry.register(
      roleScope({
        hasAuthenticatedDefaultAccess: true,
        options: () =>
          Promise.resolve([
            {
              value: 'system-administrator',
              label: 'System administrator',
              assignable: false,
              removable: false,
            },
          ]),
      }),
    );
    const service = createUserManagementService({
      database,
      users: administrationService(database.connection()),
      roleScopes: registry,
    });

    await expect(service.options()).resolves.toMatchObject({
      roleScopes: [
        {
          key: 'test',
          hasAuthenticatedDefaultAccess: true,
          options: [
            {
              value: 'system-administrator',
              assignable: false,
              removable: false,
            },
          ],
        },
      ],
    });
  });

  it('loads one page of role assignments through the scope batch API', async ({
    database,
  }) => {
    const now = new Date();
    const get = vi.fn(() =>
      Promise.reject(new Error('unexpected single read')),
    );
    const getMany = vi.fn(() =>
      Promise.resolve({ 'user-1': ['editor'], 'user-2': [] }),
    );
    const registry = createUserRoleScopeRegistry();
    registry.register(roleScope({ selection: 'multiple', get, getMany }));
    const baseUsers = administrationService(database.connection());
    const service = createUserManagementService({
      database,
      users: {
        ...baseUsers,
        list: () =>
          Promise.resolve({
            items: [
              administratedUser('user-1', now),
              administratedUser('user-2', now),
            ],
            total: 2,
            page: 1,
            pageSize: 20,
          }),
      },
      roleScopes: registry,
    });

    await expect(service.list()).resolves.toMatchObject({
      items: [
        { id: 'user-1', roleScopes: { test: ['editor'] } },
        { id: 'user-2', roleScopes: { test: [] } },
      ],
    });
    expect(getMany).toHaveBeenCalledWith(
      ['user-1', 'user-2'],
      database.connection(),
    );
    expect(get).not.toHaveBeenCalled();
  });

  it('rejects an empty required role and values with the wrong selection shape', async ({
    database,
  }) => {
    const registry = createUserRoleScopeRegistry();
    registry.register(roleScope({ selection: 'multiple' }));
    const service = createUserManagementService({
      database,
      users: administrationService(database.connection()),
      roleScopes: registry,
    });

    await expect(
      service.create({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'secret123',
        roleScopes: { test: [] },
      }),
    ).rejects.toMatchObject({ code: 'ROLE_SCOPE_REQUIRED' });
    await expect(
      service.create({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'secret123',
        roleScopes: { test: 'operator' },
      }),
    ).rejects.toMatchObject({ code: 'INVALID_ROLE_SCOPE_VALUE' });
  });
});

describe('@nocobase/app-plugin-users resource authorization', () => {
  it('does not treat a conditional grant as unconditional user access', async () => {
    const add = vi.fn();
    const container = new ServiceContainer();
    container.instance(authorizationToken, {
      resourceTypes: { add },
      subjects: { add: vi.fn() },
    } as unknown as Authorization);
    const provider = new UsersProvider({
      appName: 'test',
      publicBasePath: '',
      config: {
        get: () => ({ permissionSets: false }),
      } as unknown as AppPluginApplication['config'],
      paths: {} as AppPluginApplication['paths'],
      router: {} as AppPluginApplication['router'],
      container,
    });

    await provider.boot();

    const handler = add.mock.calls[0]?.[0] as {
      authorize(
        request: object,
        context: object,
      ): Promise<{ readonly effect: string }>;
    };
    await expect(
      handler.authorize(
        {
          principal: { type: 'user', id: 'user-1' },
          resource: { type: 'user', id: 'user-2' },
          action: 'update',
        },
        {
          grants: {
            resolve: () =>
              Promise.resolve([
                {
                  source: { plugin: 'permission-sets', id: 'conditional' },
                  resource: { type: 'user', id: '*' },
                  action: 'update',
                  policy: { type: 'unsupported-user-filter' },
                },
              ]),
          },
        },
      ),
    ).resolves.toMatchObject({ effect: 'deny' });
  });
});

function roleScope(overrides: Partial<UserRoleScope> = {}): UserRoleScope {
  return {
    key: 'test',
    label: 'Test role',
    selection: 'single',
    requiredOnCreate: true,
    options: () => Promise.resolve([{ value: 'operator', label: 'Operator' }]),
    get: () => Promise.resolve('operator'),
    findUserIds: () => Promise.resolve([]),
    replace: () => Promise.resolve(),
    ...overrides,
  };
}

function administrationService(
  initialConnection: DatabaseConnection,
): UserAdministrationService {
  const create = (
    connection: DatabaseConnection,
  ): UserAdministrationService => ({
    withConnection: (next) => create(next),
    list: () => Promise.resolve({ items: [], total: 0, page: 1, pageSize: 20 }),
    get: () => Promise.resolve(undefined),
    async create(input) {
      await connection.query
        .insertInto('testManagedUsers')
        .values({ id: 'created-user' })
        .execute();
      const now = new Date();
      return {
        id: 'created-user',
        name: input.name,
        email: input.email,
        emailVerified: false,
        disabledAt: null,
        createdAt: now,
        updatedAt: now,
      };
    },
    update: vi.fn(),
    disable: vi.fn(),
    enable: vi.fn(),
    resetPassword: vi.fn(),
    remove: vi.fn(() => Promise.resolve()),
    revokeSessions: vi.fn(),
  });
  return create(initialConnection);
}

function administratedUser(id: string, now: Date) {
  return {
    id,
    name: id,
    email: `${id}@example.com`,
    emailVerified: false,
    disabledAt: null,
    createdAt: now,
    updatedAt: now,
  };
}
