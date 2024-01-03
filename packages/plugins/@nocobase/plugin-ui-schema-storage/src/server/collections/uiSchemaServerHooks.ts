import { CollectionOptions } from '@nocobase/database';

export default {
  dumpRules: 'required',
  name: 'uiSchemaServerHooks',
  model: 'ServerHookModel',
  // autoGenId: false,
  timestamps: false,
  shared: true,
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
