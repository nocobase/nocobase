import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  audit: {
    operations: {
      createRule: 'Create a restriction rule',
      updateRule: 'Edit a restriction rule',
      deleteRule: 'Delete a restriction rule',
    },
  },
};

export type AuditLocaleResource = LocaleResource<typeof enUS>;
export default enUS;
