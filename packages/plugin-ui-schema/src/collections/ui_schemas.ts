import { TableOptions } from '@nocobase/database';

export default {
  name: 'ui_schemas',
  title: '字段配置',
  model: 'UISchema',
  fields: [
    {
      type: 'uid',
      name: 'key',
      primaryKey: true,
    },
    {
      type: 'sort',
      name: 'sort',
      scope: ['parentKey'],
    },
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'string',
      name: 'type',
    },
    {
      type: 'json',
      name: 'options',
      defaultValue: {},
    },
    {
      type: 'hasMany',
      name: 'children',
      target: 'ui_schemas',
      sourceKey: 'key',
      foreignKey: 'parentKey',
    },
  ],
} as TableOptions;
