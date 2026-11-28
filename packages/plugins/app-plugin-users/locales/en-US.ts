import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  audit: {
    operations: {
      inviteUsers: 'Invite people by email',
      resendInvitation: 'Resend an invitation',
      createUser: 'Create a user',
      updateUser: 'Edit a user',
      deleteUser: 'Delete a user',
      disableUser: 'Disable a user',
      enableUser: 'Enable a user',
      replaceUserRoles: 'Replace a user’s roles in a role scope',
      resetUserPassword: 'Reset a user’s password',
      revokeUserSessions: 'Sign a user out of all sessions',
    },
  },
};

export type AuditLocaleResource = LocaleResource<typeof enUS>;
export default enUS;
