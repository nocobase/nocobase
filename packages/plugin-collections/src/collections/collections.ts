import { TableOptions } from '@nocobase/database';

export default {
  name: 'collections',
  title: '数据表配置',
  model: 'Collection',
  sortable: 'sort',
  fields: [
    // {
    //   type: 'sort',
    //   name: 'sort',
    // },
    {
      type: 'uid',
      name: 'name',
      primaryKey: true,
      prefix: 't_',
    },
    {
      type: 'string',
      name: 'title',
      required: true,
    },
    {
      type: 'string',
      name: 'privilege',
    },
    {
      type: 'json',
      name: 'sortable',
      defaultValue: 'sort',
    },
    {
      type: 'json',
      name: 'options',
      defaultValue: {},
    },
    {
      type: 'hasMany',
      name: 'fields',
      sourceKey: 'name',
    },
    {
      type: 'belongsTo',
      name: 'uiSchema',
      target: 'ui_schemas',
    },
  ],
} as TableOptions;
