import { TableOptions } from '@nocobase/database';

export default {
  name: 'system_settings',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'boolean',
      name: 'showLogoOnly',
    },
    {
      type: 'boolean',
      name: 'allowSignUp',
      defaultValue: true,
    },
    {
      type: 'belongsTo',
      name: 'logo',
      target: 'attachments',
    },
    {
      type: 'string',
      name: 'appLang',
    },
  ],
} as TableOptions;
