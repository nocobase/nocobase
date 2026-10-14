import type { DatabaseConnection } from '@nocobase/db';
import {
  UserRoleScopeError,
  type UserManagementPolicy,
} from '@nocobase/app-plugin-users/server/tokens';

export function studioUserManagementPolicy(
  rootSet: string,
): UserManagementPolicy {
  const excludedUserIds = async (connection: DatabaseConnection) =>
    (
      await connection.query
        .selectFrom('authorizationPermissionSetAssignments')
        .select('subjectId')
        .where('subjectType', '=', 'user')
        .where('permissionSetKey', '=', rootSet)
        .execute()
    ).map((row) => String(row.subjectId));
  return {
    excludedUserIds,
    async assertTarget(_action, userId, connection) {
      const user = await connection
        .repository<{ id: string; kind: string; deletedAt: Date | null }>(
          'user',
        )
        .findOne({
          filter: { id: userId },
          select: (select) => select.fields('id', 'kind', 'deletedAt'),
        });
      if (!user || user.deletedAt)
        throw new UserRoleScopeError(
          'USER_NOT_FOUND',
          'The user does not exist',
          404,
        );
      if (
        user.kind !== 'person' ||
        (await excludedUserIds(connection)).includes(userId)
      )
        throw new UserRoleScopeError(
          'USER_OUT_OF_SCOPE',
          'This account is outside ordinary user management',
          403,
        );
    },
    async assertAction(action, context) {
      if (
        ['update', 'disable', 'enable', 'reset-password'].includes(action) &&
        context?.credential !== 'session'
      )
        throw new UserRoleScopeError(
          'SIGN_IN_REQUIRED',
          'This action requires a signed-in session',
          403,
        );
    },
  };
}
