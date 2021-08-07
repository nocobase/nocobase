import { TableOptions } from '@nocobase/database';

export default {
  name: 'collections',
  title: '数据表配置',
  model: 'Collection',
  sortable: 'sort',
  fields: [
    {
      type: 'uid',
      name: 'name',
      primaryKey: true,
      prefix: 't_',
    },
    {
      type: 'boolean',
      name: 'logging',
      defaultValue: true,
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
      target: 'fields',
      sourceKey: 'name',
    },
    {
      type: 'hasMany',
      name: 'generalFields',
      target: 'fields',
      foreignKey: 'collection_name',
      sourceKey: 'name',
      scope: {
        state: 1,
      },
    },
    {
      type: 'hasMany',
      name: 'systemFields',
      target: 'fields',
      foreignKey: 'collection_name',
      sourceKey: 'name',
      scope: {
        state: 0,
      },
    },
    {
      type: 'belongsTo',
      name: 'uiSchema',
      target: 'ui_schemas',
    },
  ],
} as TableOptions;
