import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'ui_schemas',
  title: '字段配置',
  autoGenId: false,
  timestamps: false,
  repository: 'UiSchemaRepository',
  model: 'MagicAttributeModel',
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
      type: 'json',
      name: 'schema',
      defaultValue: {},
    },
  ],
} as CollectionOptions;
