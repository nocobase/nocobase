import { CollectionOptions } from '@nocobase/database';

export default {
  duplicator: {
    dataType: 'business',
  },
  name: 'executions',
  fields: [
    {
      type: 'belongsTo',
      name: 'workflow',
    },
    {
      type: 'uid',
      name: 'key',
    },
    {
      type: 'hasMany',
      name: 'jobs',
      onDelete: 'CASCADE',
    },
    {
      type: 'json',
      name: 'context',
    },
    {
      type: 'integer',
      name: 'status',
    },
  ],
} as CollectionOptions;
