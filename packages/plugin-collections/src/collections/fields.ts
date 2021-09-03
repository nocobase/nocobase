import { TableOptions } from '@nocobase/database';
import { DataTypes } from 'sequelize';

export default {
  name: 'fields',
  title: '字段配置',
  model: 'Field',
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
      prefix: 'f_',
    },
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'string',
      name: 'interface',
    },
    {
      type: 'string',
      name: 'dataType',
    },
    {
      type: 'string',
      name: 'privilege',
    },
    {
      type: 'integer',
      name: 'state',
      defaultValue: 1,
    },
    {
      type: 'hasMany',
      name: 'children',
      target: 'fields',
      sourceKey: 'key',
      foreignKey: 'parentKey',
    },
    {
      type: 'belongsTo',
      name: 'collection',
      target: 'collections',
      targetKey: 'name',
    },
    {
      type: 'belongsTo',
      name: 'reverseField',
      target: 'fields',
      sourceKey: 'key',
      foreignKey: 'reverseKey',
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
