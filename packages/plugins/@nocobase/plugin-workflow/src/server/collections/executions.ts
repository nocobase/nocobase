import { CollectionOptions } from '@nocobase/database';

export default {
  dumpRules: {
    group: 'log',
  },
  name: 'executions',
  shared: true,
  fields: [
    {
      type: 'belongsTo',
      name: 'workflow',
    },
    {
      type: 'string',
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
