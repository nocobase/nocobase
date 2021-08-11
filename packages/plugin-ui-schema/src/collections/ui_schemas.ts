import { TableOptions } from '@nocobase/database';

export default {
  name: 'ui_schemas',
  title: '字段配置',
  model: 'UISchema',
  sortable: {
    type: 'sort',
    name: 'sort',
    scope: ['parentKey'],
  },
  fields: [
    {
      type: 'uid',
      name: 'key',
      primaryKey: true,
    },
    // {
    //   type: 'sort',
    //   name: 'sort',
    //   scope: ['parentKey'],
    // },
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
      type: 'string',
      name: 'x-component',
    },
    {
      type: 'json',
      name: 'options',
      defaultValue: {},
    },
    {
      type: 'boolean',
      name: 'async',
      defaultValue: false,
    },
    {
      type: 'hasMany',
      name: 'children',
      target: 'ui_schemas',
      sourceKey: 'key',
      foreignKey: 'parentKey',
    },
    {
      type: 'belongsToMany',
      name: 'roles',
      target: 'roles',
      through: 'roles_ui_schemas'
    },
  ],
} as TableOptions;
