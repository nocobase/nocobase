import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'approvals',
  fields: [
    {
      type: 'belongsTo',
      name: 'post',
    },
    {
      type: 'integer',
      name: 'status',
      defaultValue: 0
    }
  ],
} as CollectionOptions;
