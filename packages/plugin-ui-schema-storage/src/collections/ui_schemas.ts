import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'ui_schemas',
  title: '字段配置',
  autoGenId: false,
  timestamps: false,
  repository: 'UiSchemaRepository',
  model: 'UiSchemaModel',
  magicAttribute: 'schema',
  fields: [
    {
      type: 'uid',
      name: 'x-uid',
      field: 'uid',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'uid',
      field: 'uid',
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
