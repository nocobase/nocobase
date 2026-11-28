import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  audit: {
    operations: {
      createRule: 'Create a default access rule',
      updateRule: 'Edit a default access rule',
      deleteRule: 'Delete a default access rule',
    },
  },
};

export type AuditLocaleResource = LocaleResource<typeof enUS>;
export default enUS;
