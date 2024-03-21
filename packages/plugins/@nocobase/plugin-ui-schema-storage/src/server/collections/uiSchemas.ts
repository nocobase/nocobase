import { CollectionOptions } from '@nocobase/database';

export default {
  dumpRules: 'required',
  name: 'uiSchemas',
  autoGenId: false,
  timestamps: false,
  repository: 'UiSchemaRepository',
  model: 'UiSchemaModel',
  magicAttribute: 'schema',
  fields: [
    {
      type: 'uid',
      name: 'x-uid',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'hasMany',
      name: 'serverHooks',
      target: 'uiSchemaServerHooks',
      foreignKey: 'uid',
    },
    {
      type: 'json',
      name: 'schema',
      defaultValue: {},
    },
  ],
} as CollectionOptions;
