import { CollectionOptions } from '@nocobase/database';

export default {
  namespace: 'workflow',
  duplicator: 'optional',
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
    // @deprecated
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
