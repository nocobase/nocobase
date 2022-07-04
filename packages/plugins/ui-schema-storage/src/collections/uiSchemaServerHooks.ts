import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'uiSchemaServerHooks',
  model: 'ServerHookModel',
  // autoGenId: false,
  timestamps: false,
  fields: [
    { type: 'belongsTo', name: 'uiSchema', target: 'uiSchemas', foreignKey: 'uid' },
    { type: 'string', name: 'type' },
    {
      type: 'string',
      name: 'collection',
    },
    {
      type: 'string',
      name: 'field',
    },
    {
      type: 'string',
      name: 'method',
    },
    {
      type: 'json',
      name: 'params',
    },
  ],
} as CollectionOptions;
