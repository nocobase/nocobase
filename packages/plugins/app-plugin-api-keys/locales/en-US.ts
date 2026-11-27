import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  audit: {
    operations: {
      createPersonalKey: 'Create a personal API key',
      rotatePersonalKey: 'Rotate a personal API key',
      revokePersonalKey: 'Revoke a personal API key',
      revokeMemberKey: 'Revoke a member’s personal API key',
      updateRules: 'Update API key rules',
      createSystemKey: 'Create a system API key',
      updateSystemKey: 'Edit a system API key',
      replaceSystemKeyPermissions: 'Replace a system API key’s permissions',
      rotateSystemKey: 'Rotate a system API key',
      disableSystemKey: 'Disable a system API key',
      enableSystemKey: 'Enable a system API key',
      deleteSystemKey: 'Delete a system API key',
    },
  },
};

export type AuditLocaleResource = LocaleResource<typeof enUS>;
export default enUS;
