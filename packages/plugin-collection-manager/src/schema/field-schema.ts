import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'fields',
  title: '字段配置',
  model: 'FieldModel',
  autoGenId: false,
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
      allowNull: true,
    },
    {
      type: 'string',
      name: 'type',
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
      targetKey: 'key',
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
} as CollectionOptions;
