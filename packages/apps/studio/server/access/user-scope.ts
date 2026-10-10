/**
 * Studio's roles in the Users plugin's user pages (`users.permissionSets: false` turns off the plugin's own picker, so
 * the roles are offered once). The superuser set is shown but never given or taken here. An API key's own permission
 * set is not a role and is never offered, and an API key's identity is never given a role (`api-keys.ts`).
 */
import type { AppAuthorization } from '@nocobase/app-plugin-authorization';
import {
  UserManagementError,
  type UserRoleScope,
} from '@nocobase/app-plugin-users/server/tokens';

import type { StudioAccess } from './service.js';

export function createStudioUserRoleScope(
  authz: AppAuthorization,
  access: StudioAccess,
  rootSet: string,
): UserRoleScope {
  const sets = authz.permissionSets;
  const offered = (key: string) => key === rootSet || access.isRole(key);
  const state = async (
    connection?: Parameters<typeof sets.withTransaction>[0],
  ) => {
    const api = connection ? sets.withTransaction(connection) : sets;
    const [all, assignments] = await Promise.all([
      api.list(),
      api.listAssignments(),
    ]);
    return {
      keys: all.filter((set) => offered(set.key)),
      assignments: assignments.filter(
        (item) => item.subject.type === 'user' && offered(item.permissionSet),
      ),
    };
  };
  const rolesOf = (
    userId: string,
    assignments: Awaited<ReturnType<typeof state>>['assignments'],
  ) =>
    assignments
      .filter((item) => item.subject.id === userId)
      .map((item) => item.permissionSet);
  return {
    key: 'studio',
    label: 'Roles',
    labelI18nKey: 'roles.scope',
    labelI18nNs: '@nocobase/i18n/application',
    selection: 'multiple',
    hasAuthenticatedDefaultAccess: true,
    async options() {
      return (await state()).keys.map((set) => {
        const title = set.title;
        return {
          value: set.key,
          label: (typeof title === 'string' ? title : title?.key) || set.key,
          ...(typeof title === 'object' && title
            ? { labelI18nKey: title.key, labelI18nNs: title.ns }
            : {}),
          ...(set.key === rootSet
            ? { assignable: false, removable: false }
            : {}),
        };
      });
    },
    async get(userId, connection) {
      return rolesOf(userId, (await state(connection)).assignments);
    },
    async getMany(userIds, connection) {
      const { assignments } = await state(connection);
      return Object.fromEntries(
        userIds.map((id) => [id, rolesOf(id, assignments)]),
      );
    },
    async findUserIds(role, connection) {
      return (await state(connection)).assignments
        .filter((item) => item.permissionSet === role)
        .map((item) => item.subject.id);
    },
    async replace(userId, value, connection) {
      const user = await connection
        .repository<{ id: string; kind: string | null }>('user')
        .findOne({ filter: { id: userId } });
      if (user?.kind === 'service')
        throw new UserManagementError(
          'INVALID_ROLE_SCOPE_VALUE',
          'An API key’s permissions are chosen on the key, not by roles',
        );
      if (typeof value === 'string')
        throw new UserManagementError(
          'INVALID_ROLE_SCOPE_VALUE',
          'Studio roles are a list',
        );
      const { keys } = await state(connection);
      const available = keys
        .map((set) => set.key)
        .filter((key) => key !== rootSet);
      for (const key of value)
        if (!available.includes(key))
          throw new UserManagementError(
            'INVALID_ROLE_SCOPE_VALUE',
            `Unknown role: ${key}`,
          );
      await sets.withTransaction(connection).replaceSubjectAssignments({
        subject: { type: 'user', id: userId },
        managedPermissionSets: available,
        permissionSets: value,
      });
    },
  };
}
