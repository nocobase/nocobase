import type { PermissionSetsApi } from '@nocobase/app-plugin-authorization';
import {
  UserManagementError,
  UserRoleScopeError,
  type UserRoleScope,
  type UserRoleValue,
} from '../tokens.js';
import type { DatabaseConnection } from '@nocobase/db';
const USERS_I18N_NAMESPACE = '@nocobase/app-plugin-users';
/**
 * The role picker for the Permission Sets this application assigns directly.
 * A set that confers unrestricted access is shown but never assigned or
 * removed here.
 */
export function createApplicationUserRoleScope(
  permissionSets: PermissionSetsApi,
): UserRoleScope {
  const isUnrestricted = (key: string): boolean =>
    permissionSets.protection(key)?.unrestricted === true;
  return {
    key: 'app',
    label: 'Permission sets',
    labelI18nKey: 'page.roles',
    labelI18nNs: USERS_I18N_NAMESPACE,
    selection: 'multiple',
    defaultValue: ['member'],
    hasAuthenticatedDefaultAccess: async () =>
      (await permissionSets.listAssignments()).some(
        (assignment) =>
          assignment.subject.type === 'authenticated' &&
          assignment.subject.id === '*',
      ),
    async options() {
      const state = await directRoleState(permissionSets);
      return state.permissionSets.map((permissionSet) => {
        const titleDescriptor =
          typeof permissionSet.title === 'object'
            ? permissionSet.title
            : undefined;
        return {
          value: permissionSet.key,
          label:
            (typeof permissionSet.title === 'string'
              ? permissionSet.title.trim()
              : permissionSet.title?.key) || permissionSet.key,
          ...(titleDescriptor
            ? {
                labelI18nKey: titleDescriptor.key,
                labelI18nNs: titleDescriptor.ns,
              }
            : {}),
          ...(isUnrestricted(permissionSet.key)
            ? {
                assignable: false,
                removable: false,
              }
            : {}),
        };
      });
    },
    async get(userId, connection) {
      const state = await directRoleState(permissionSets, connection);
      return rolesForUser(userId, state);
    },
    async getMany(userIds, connection) {
      const state = await directRoleState(permissionSets, connection);
      return Object.fromEntries(
        userIds.map((userId) => [userId, rolesForUser(userId, state)]),
      );
    },
    async findUserIds(role, connection) {
      const state = await directRoleState(permissionSets, connection);
      requireDirectRole(
        role,
        state.permissionSets.map(({ key }) => key),
      );
      return state.assignments
        .filter(
          (assignment) =>
            assignment.permissionSet === role &&
            assignment.subject.type === 'user',
        )
        .map((assignment) => assignment.subject.id);
    },
    async replace(userId, value, connection) {
      const requested = multipleRoles(value);
      const state = await directRoleState(permissionSets, connection);
      const managed = state.permissionSets.map(({ key }) => key);
      for (const role of requested) requireDirectRole(role, managed);

      const current = state.assignments
        .filter(
          (assignment) =>
            assignment.subject.type === 'user' &&
            assignment.subject.id === userId &&
            managed.includes(assignment.permissionSet),
        )
        .map((assignment) => assignment.permissionSet);
      const currentSet = new Set(current);
      const requestedSet = new Set(requested);
      const changed = [...new Set([...currentSet, ...requestedSet])].find(
        (key) =>
          isUnrestricted(key) && currentSet.has(key) !== requestedSet.has(key),
      );
      if (changed !== undefined) {
        throw new UserRoleScopeError(
          'PROTECTED_ROLE_ASSIGNMENT',
          `The ${changed} role cannot be assigned or removed from User management`,
          409,
        );
      }

      await permissionSets
        .withTransaction(connection)
        .replaceSubjectAssignments({
          subject: { type: 'user', id: userId },
          managedPermissionSets: managed,
          permissionSets: requested,
        });
    },
  };
}

function rolesForUser(
  userId: string,
  state: Awaited<ReturnType<typeof directRoleState>>,
): readonly string[] {
  const directKeys = new Set(state.permissionSets.map(({ key }) => key));
  return state.assignments
    .filter(
      (assignment) =>
        assignment.subject.type === 'user' &&
        assignment.subject.id === userId &&
        directKeys.has(assignment.permissionSet),
    )
    .map((assignment) => assignment.permissionSet);
}

async function directRoleState(
  permissionSets: PermissionSetsApi,
  connection?: DatabaseConnection,
) {
  const scoped = connection
    ? permissionSets.withTransaction(connection)
    : permissionSets;
  const [sets, assignments] = await Promise.all([
    scoped.list(),
    scoped.listAssignments(),
  ]);
  const authenticatedDefaults = new Set(
    assignments
      .filter(
        (assignment) =>
          assignment.subject.type === 'authenticated' &&
          assignment.subject.id === '*',
      )
      .map((assignment) => assignment.permissionSet),
  );
  return {
    permissionSets: sets.filter(
      ({ key }) =>
        !authenticatedDefaults.has(key) &&
        (key === 'member' ||
          permissionSets.protection(key)?.unrestricted === true ||
          permissionSets.protection(key) === undefined),
    ),
    assignments,
  };
}

function requireDirectRole(role: string, available: readonly string[]): void {
  if (!available.includes(role)) {
    throw new UserManagementError(
      'INVALID_ROLE_SCOPE_VALUE',
      `Unknown application role: ${role}`,
    );
  }
}

function multipleRoles(value: UserRoleValue): readonly string[] {
  if (typeof value === 'string') {
    throw new UserManagementError(
      'INVALID_ROLE_SCOPE_VALUE',
      'The application role scope accepts a role list',
    );
  }
  return [...value];
}
