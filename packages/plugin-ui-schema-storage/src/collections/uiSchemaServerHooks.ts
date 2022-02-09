import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'uiSchemaServerHooks',
  model: 'ServerHookModel',
  // autoGenId: false,
  timestamps: false,
  fields: [
    { type: 'belongsTo', name: 'uiSchema', target: 'ui_schemas', foreignKey: 'uid' },
    { type: 'string', name: 'type' },
    {
      type: 'string',
      name: 'collection',
    },
    {
      type: 'array',
      name: 'fields',
    },
    {
      type: 'string',
      name: 'method',
    },
  ],
} as CollectionOptions;
