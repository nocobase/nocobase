/**
 * Studio's roles in the Users plugin's user pages (`users.permissionSets: false` turns off the plugin's own picker, so
 * the roles are offered once). The superuser set is shown but never given or taken here. An API key's own permission
 * set is not a role and is never offered, and an API key's identity is never given a role (`api-keys.ts`).
 */
import type { AppAuthorization } from '@nocobase/app-plugin-authorization';
import { type UserRoleScope } from '@nocobase/app-plugin-users/server/tokens';

import { lockUserForAdministration } from '@nocobase/app-plugin-authentication';
import { UserRoleScopeError } from '@nocobase/app-plugin-users/server/tokens';
import { ROLES } from '../../shared/access.js';

import type { StudioAccess } from './service.js';

export function createStudioUserRoleScope(
  authz: AppAuthorization,
  access: Pick<StudioAccess, 'isRole'>,
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
    notifiesChanges: true,
    hasAuthenticatedDefaultAccess: true,
    async options(context) {
      const current = await state();
      const owns =
        context &&
        current.assignments.some(
          (a) =>
            a.subject.id === context.actor.id &&
            a.permissionSet === ROLES.owner,
        );
      return current.keys.map((set) => {
        const title = set.title;
        return {
          value: set.key,
          label: (typeof title === 'string' ? title : title?.key) || set.key,
          ...(typeof title === 'object' && title
            ? { labelI18nKey: title.key, labelI18nNs: title.ns }
            : {}),
          ...(set.key === ROLES.owner && !owns
            ? { assignable: false, removable: false }
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
    async replace(userId, value, connection, context) {
      if (
        context?.identity &&
        (context.identity.principal.type !== 'user' ||
          context.identity.principal.id !== context.actor.id)
      )
        throw new UserRoleScopeError(
          'ACTOR_MISMATCH',
          'The actor must match the authenticated identity',
          403,
        );
      if (!context?.actor.id)
        throw new UserRoleScopeError(
          'ACTOR_REQUIRED',
          'Trusted actor context is required',
          403,
        );
      if (typeof value === 'string')
        throw new UserRoleScopeError(
          'INVALID_ROLE_SCOPE_VALUE',
          'Studio roles are a list',
        );
      // The definitions may be read before the lock; assignment decisions are re-read under the lock.
      const api = sets.withTransaction(connection);
      const available = (await api.list())
        .filter((set) => access.isRole(set.key) && set.key !== rootSet)
        .map((set) => set.key);
      for (const key of value)
        if (!available.includes(key))
          throw new UserRoleScopeError(
            'INVALID_ROLE_SCOPE_VALUE',
            'Unknown Studio role',
          );
      await api.replaceSubjectAssignments({
        subject: { type: 'user', id: userId },
        managedPermissionSets: available,
        permissionSets: value,
        beforeReplace: async () => {
          for (const id of [...new Set([context.actor.id, userId])].sort())
            await lockUserForAdministration(connection, id);
          const rows = await connection.query
            .selectFrom('user')
            .select(['id', 'kind', 'disabledAt', 'deletedAt'])
            .where('id', 'in', [context.actor.id, userId])
            .execute();
          const target = rows.find((row) => row.id === userId);
          const actor = rows.find((row) => row.id === context.actor.id);
          if (!target || target.deletedAt)
            throw new UserRoleScopeError(
              'USER_NOT_FOUND',
              'The user does not exist',
              404,
            );
          if (!actor || actor.disabledAt || actor.deletedAt)
            throw new UserRoleScopeError(
              'ACTOR_DISABLED',
              'The actor cannot assign roles',
              403,
            );
          const assignments = await api.listAssignments();
          const held = (id: string) =>
            assignments
              .filter((a) => a.subject.type === 'user' && a.subject.id === id)
              .map((a) => a.permissionSet);
          const current = held(userId);
          if (current.includes(rootSet) || target.kind !== 'person')
            throw new UserRoleScopeError(
              'USER_OUT_OF_SCOPE',
              'This account is outside ordinary user management',
              403,
            );
          const changed = [
            ...value.filter((key) => !current.includes(key)),
            ...current.filter(
              (key) => available.includes(key) && !value.includes(key),
            ),
          ];
          if (
            changed.includes(ROLES.owner) &&
            !held(context.actor.id).includes(ROLES.owner)
          )
            throw new UserRoleScopeError(
              'OWNER_REQUIRED',
              'Only a direct owner may grant or revoke owner',
              403,
            );
          if (target.disabledAt && value.some((key) => !current.includes(key)))
            throw new UserRoleScopeError(
              'USER_DISABLED',
              'A disabled user cannot receive new roles',
            );
        },
      });
    },
  };
}
