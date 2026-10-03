import { lockUserForAdministration } from '@nocobase/app-plugin-authentication';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import type { PermissionSetsApi } from '@nocobase/authorization/permission-sets';
import type {
  AdministratedUser,
  UserAdministrationService,
} from '@nocobase/app-plugin-authentication';

import {
  UserManagementError,
  type CreateManagedUserInput,
  type ListManagedUsersInput,
  type ManagedUser,
  type UserManagementOptions,
  type UserManagementService,
  type UserRoleScope,
  type UserRoleScopeRegistry,
  type UserRoleValue,
} from '../tokens.js';

export function createUserRoleScopeRegistry(): UserRoleScopeRegistry {
  const scopes = new Map<string, UserRoleScope>();
  return {
    register(scope) {
      if (scopes.has(scope.key)) {
        throw new Error(`User role scope already registered: ${scope.key}`);
      }
      scopes.set(scope.key, scope);
      return () => {
        if (scopes.get(scope.key) === scope) scopes.delete(scope.key);
      };
    },
    get: (key) => scopes.get(key),
    list: () => [...scopes.values()],
  };
}

export interface CreateUserManagementServiceOptions {
  readonly database: DatabaseManager;
  readonly users: UserAdministrationService;
  readonly roleScopes: UserRoleScopeRegistry;
  /**
   * Absent in an application assembled without authorization. When present,
   * disabling an account asks it whether that account is the last one able to
   * use a Permission Set the application must always keep in use.
   */
  readonly permissionSets?: PermissionSetsApi<DatabaseConnection>;
  readonly onRoleScopesChanged?: (userId: string) => void | Promise<void>;
}

export function createUserManagementService(
  options: CreateUserManagementServiceOptions,
): UserManagementService {
  return new DefaultUserManagementService(options);
}

class DefaultUserManagementService implements UserManagementService {
  constructor(private readonly services: CreateUserManagementServiceOptions) {}

  async options(): Promise<UserManagementOptions> {
    return {
      roleScopes: await Promise.all(
        this.services.roleScopes.list().map(async (scope) => ({
          key: scope.key,
          label: scope.label,
          ...(scope.labelI18nKey === undefined
            ? {}
            : { labelI18nKey: scope.labelI18nKey }),
          ...(scope.labelI18nNs === undefined
            ? {}
            : { labelI18nNs: scope.labelI18nNs }),
          selection: scope.selection,
          requiredOnCreate: scope.requiredOnCreate ?? false,
          hasAuthenticatedDefaultAccess:
            scope.hasAuthenticatedDefaultAccess ?? false,
          options: await scope.options(),
        })),
      ),
    };
  }

  async list(input: ListManagedUsersInput = {}) {
    const connection = this.services.database.connection();
    let userIds: readonly string[] | undefined;
    if (input.roleScope || input.role) {
      if (!input.roleScope || !input.role) {
        throw new UserManagementError(
          'INVALID_ROLE_SCOPE_VALUE',
          'Role filtering requires both roleScope and role',
        );
      }
      const scope = this.requireScope(input.roleScope);
      userIds = await scope.findUserIds(input.role, connection);
    }
    const page = await this.services.users.list({
      page: input.page,
      pageSize: input.pageSize,
      search: input.search,
      status: input.status,
      userIds,
    });
    return {
      ...page,
      items: await this.withRoleScopesForUsers(page.items, connection),
    };
  }

  /**
   * Role scopes feed the user's permission snapshot, so its clients are told
   * once the change has committed, and not at all if it rolls back.
   */
  private afterRoleScopesCommit(
    connection: DatabaseConnection,
    userId: string,
  ): void {
    const changed = this.services.onRoleScopesChanged;
    if (changed) connection.afterCommit(() => changed(userId));
  }

  async create(input: CreateManagedUserInput): Promise<ManagedUser> {
    const submitted = input.roleScopes ?? {};
    this.validateCreateRoleScopes(submitted);
    const user = await this.services.database.transaction(
      async (connection) => {
        const users = this.services.users.withConnection(connection);
        const created = await users.create(input);
        for (const [key, value] of Object.entries(submitted)) {
          await this.requireScope(key).replace(created.id, value, connection);
        }
        if (Object.keys(submitted).length > 0) {
          this.afterRoleScopesCommit(connection, created.id);
        }
        return created;
      },
    );
    return this.withRoleScopes(user, this.services.database.connection());
  }

  async update(
    userId: string,
    input: Parameters<UserManagementService['update']>[1],
  ) {
    const user = await this.services.database.transaction(
      async (connection) => {
        await lockUserForAdministration(connection, userId);
        return this.services.users
          .withConnection(connection)
          .update(userId, input);
      },
    );
    return this.withRoleScopes(user, this.services.database.connection());
  }

  async disable(userId: string): Promise<ManagedUser> {
    const user = await this.services.database.transaction(
      async (connection) => {
        for (const scope of this.services.roleScopes.list()) {
          await scope.assertCanDisable?.(userId, connection);
        }
        // A disabled account can no longer act, so disabling it removes the
        // subject from every Permission Set as surely as revoking would.
        await this.services.permissionSets
          ?.withTransaction(connection)
          .assertSubjectRemovable({ type: 'user', id: userId });
        await lockUserForAdministration(connection, userId);
        return this.services.users.withConnection(connection).disable(userId);
      },
    );
    return this.withRoleScopes(user, this.services.database.connection());
  }

  async remove(userId: string, actorId: string): Promise<void> {
    if (
      !this.services.roleScopes
        .list()
        .some(
          (scope) =>
            typeof scope.assertCanDelete === 'function' &&
            typeof scope.onDelete === 'function',
        )
    )
      throw new UserManagementError(
        'USER_DELETION_NOT_CONFIGURED',
        'User deletion is not configured for this application.',
        409,
      );
    if (userId === actorId)
      throw new UserManagementError(
        'SELF_DELETE_NOT_ALLOWED',
        'You cannot delete your own account.',
        409,
      );
    await this.services.database.transaction(async (connection) => {
      for (const scope of this.services.roleScopes.list()) {
        await scope.assertCanDelete?.(userId, actorId, connection);
      }
      await this.services.permissionSets
        ?.withTransaction(connection)
        .assertSubjectRemovable({ type: 'user', id: userId });
      const users = this.services.users.withConnection(connection);
      if (!(await users.get(userId))) return;
      for (const scope of this.services.roleScopes.list())
        await scope.onDelete?.(userId, connection);
      await users.remove(userId, actorId);
      this.afterRoleScopesCommit(connection, userId);
    });
  }

  async enable(userId: string): Promise<ManagedUser> {
    const user = await this.services.database.transaction(
      async (connection) => {
        await lockUserForAdministration(connection, userId);
        return this.services.users.withConnection(connection).enable(userId);
      },
    );
    return this.withRoleScopes(user, this.services.database.connection());
  }

  async replaceRoleScope(
    userId: string,
    scopeKey: string,
    value: UserRoleValue,
  ): Promise<ManagedUser> {
    const scope = this.requireScope(scopeKey);
    this.validateRoleScopeValue(scope, value);
    await this.services.database.transaction(async (connection) => {
      const user = await this.services.users
        .withConnection(connection)
        .get(userId);
      if (!user) {
        throw new UserManagementError(
          'USER_NOT_FOUND',
          `Unknown user: ${userId}`,
          404,
        );
      }
      await scope.replace(userId, value, connection);
      this.afterRoleScopesCommit(connection, userId);
    });
    const user = await this.services.users.get(userId);
    if (!user) {
      throw new UserManagementError(
        'USER_NOT_FOUND',
        `Unknown user: ${userId}`,
        404,
      );
    }
    return this.withRoleScopes(user, this.services.database.connection());
  }

  async resetPassword(userId: string, password: string): Promise<void> {
    await this.services.database.transaction(async (connection) => {
      await lockUserForAdministration(connection, userId);
      await this.services.users
        .withConnection(connection)
        .resetPassword(userId, password);
    });
  }

  revokeSessions(userId: string): Promise<void> {
    return this.services.users.revokeSessions(userId);
  }

  private validateCreateRoleScopes(
    submitted: Readonly<Record<string, UserRoleValue>>,
  ): void {
    for (const [key, value] of Object.entries(submitted)) {
      this.validateRoleScopeValue(this.requireScope(key), value);
    }
    for (const scope of this.services.roleScopes.list()) {
      const value = submitted[scope.key];
      if (
        scope.requiredOnCreate &&
        (value === undefined || roleValueIsEmpty(value))
      ) {
        throw new UserManagementError(
          'ROLE_SCOPE_REQUIRED',
          `Role scope "${scope.key}" is required when creating a user`,
        );
      }
    }
  }

  private validateRoleScopeValue(
    scope: UserRoleScope,
    value: UserRoleValue,
  ): void {
    const valid =
      scope.selection === 'single'
        ? typeof value === 'string' && value.trim().length > 0
        : typeof value !== 'string' &&
          value.every((role) => role.trim().length > 0) &&
          new Set(value).size === value.length;
    if (!valid) {
      throw new UserManagementError(
        'INVALID_ROLE_SCOPE_VALUE',
        `Role scope "${scope.key}" requires a ${scope.selection} selection`,
      );
    }
  }

  private requireScope(key: string): UserRoleScope {
    const scope = this.services.roleScopes.get(key);
    if (!scope) {
      throw new UserManagementError(
        'ROLE_SCOPE_NOT_FOUND',
        `Unknown user role scope: ${key}`,
        404,
      );
    }
    return scope;
  }

  private async withRoleScopes(
    user: AdministratedUser,
    connection: ReturnType<DatabaseManager['connection']>,
  ): Promise<ManagedUser> {
    const entries = await Promise.all(
      this.services.roleScopes
        .list()
        .map(
          async (scope) =>
            [scope.key, await scope.get(user.id, connection)] as const,
        ),
    );
    return { ...user, roleScopes: Object.fromEntries(entries) };
  }

  private async withRoleScopesForUsers(
    users: readonly AdministratedUser[],
    connection: ReturnType<DatabaseManager['connection']>,
  ): Promise<readonly ManagedUser[]> {
    const scopes = this.services.roleScopes.list();
    const valuesByScope = await Promise.all(
      scopes.map(async (scope) => {
        const values = scope.getMany
          ? await scope.getMany(
              users.map(({ id }) => id),
              connection,
            )
          : Object.fromEntries(
              await Promise.all(
                users.map(
                  async (user) =>
                    [user.id, await scope.get(user.id, connection)] as const,
                ),
              ),
            );
        return [scope, values] as const;
      }),
    );
    return users.map((user) => ({
      ...user,
      roleScopes: Object.fromEntries(
        valuesByScope.map(([scope, values]) => [
          scope.key,
          values[user.id] ?? (scope.selection === 'multiple' ? [] : ''),
        ]),
      ),
    }));
  }
}

function roleValueIsEmpty(value: UserRoleValue): boolean {
  return typeof value === 'string'
    ? value.trim().length === 0
    : value.length === 0;
}
