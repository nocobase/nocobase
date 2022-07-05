import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'executions',
  fields: [
    {
      type: 'belongsTo',
      name: 'workflow'
    },
    {
      type: 'uid',
      name: 'key'
    },
    {
      type: 'boolean',
      name: 'useTransaction',
      defaultValue: false
    },
    {
      type: 'uuid',
      name: 'transaction',
      defaultValue: null
    },
    {
      type: 'hasMany',
      name: 'jobs',
    },
    {
      type: 'jsonb',
      name: 'context',
    },
    {
      type: 'integer',
      name: 'status',
    }
  ]
} as CollectionOptions;
