import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  audit: {
    operations: {
      signIn: 'Sign in with email',
      signInWithUsername: 'Sign in with a username',
      signUp: 'Sign up',
      signOut: 'Sign out',
      changePassword: 'Change password',
      resetPassword: 'Reset password',
      updateProfile: 'Update profile',
      createApiKey: 'Create an API key',
      revokeApiKey: 'Revoke an API key',
    },
  },
};

export type AuditLocaleResource = LocaleResource<typeof enUS>;
export default enUS;
