import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  audit: {
    operations: {
      createOne: 'Create a record',
      updateOne: 'Update a record',
      deleteOne: 'Delete a record',
    },
  },
};

export type AuditLocaleResource = LocaleResource<typeof enUS>;
export default enUS;
