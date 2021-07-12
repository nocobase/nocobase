import { TableOptions } from '@nocobase/database';

export default {
  name: 'routes',
  title: '路由表',
  model: 'Route',
  fields: [
    {
      type: 'uid',
      name: 'key',
      prefix: 'r_',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'type',
    },
    {
      type: 'hasMany',
      name: 'children',
      target: 'routes',
      sourceKey: 'key',
      foreignKey: 'parentKey',
    },
    {
      type: 'belongsTo',
      name: 'uiSchema',
      target: 'ui_schemas',
    },
    {
      type: 'json',
      name: 'options',
      defaultValue: {},
    },
  ],
} as TableOptions;
