import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'ui_schemas',
  title: '字段配置',
  autoGenId: false,
  timestamps: false,
  repository: 'UiSchemaRepository',
  fields: [
    {
      type: 'uid',
      name: 'uid',
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
