import { TableOptions } from '@nocobase/database';
import { DataTypes } from 'sequelize';

export default {
  name: 'fields',
  title: '字段配置',
  model: 'Field',
  fields: [
    {
      type: 'sort',
      name: 'sort',
      scope: ['parentKey'],
    },
    {
      type: 'uid',
      name: 'key',
      primaryKey: true,
      prefix: 'f_',
      // autoIncrement: false,
      // defaultValue: DataTypes.UUIDV4,
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
      type: 'hasMany',
      name: 'children',
      target: 'fields',
      sourceKey: 'key',
      foreignKey: 'parentKey',
    },
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'collection',
      target: 'collections',
      targetKey: 'name',
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
