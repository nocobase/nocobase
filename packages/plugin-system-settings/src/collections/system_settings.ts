import { TableOptions } from '@nocobase/database';

export default {
  name: 'system_settings',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'belongsTo',
      name: 'logo',
      target: 'attachments',
    },
  ],
} as TableOptions;
