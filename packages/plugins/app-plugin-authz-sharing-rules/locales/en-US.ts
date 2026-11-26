import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  audit: {
    operations: {
      createRule: 'Create a sharing rule',
      updateRule: 'Edit a sharing rule',
      deleteRule: 'Delete a sharing rule',
    },
  },
};

export type AuditLocaleResource = LocaleResource<typeof enUS>;
export default enUS;
