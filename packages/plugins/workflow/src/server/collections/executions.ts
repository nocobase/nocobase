import { CollectionOptions } from '@nocobase/database';

export default {
  namespace: 'workflow.executionLogs',
  duplicator: 'optional',
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
      type: 'boolean',
      name: 'useTransaction',
      defaultValue: false,
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
