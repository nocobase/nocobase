import { CollectionOptions } from '@nocobase/database';

export default {
  dumpRules: 'required',
  shared: true,
  name: 'fields',
  autoGenId: false,
  model: 'FieldModel',
  timestamps: false,
  sortable: {
    name: 'sort',
    scopeKey: 'collectionName',
  },
  indexes: [
    {
      type: 'UNIQUE',
      fields: ['collectionName', 'name'],
    },
  ],
  fields: [
    {
      type: 'uid',
      name: 'key',
      primaryKey: true,
    },
    {
      type: 'uid',
      name: 'name',
      prefix: 'f_',
    },
    {
      type: 'string',
      name: 'type',
    },
    {
      type: 'string',
      name: 'interface',
      allowNull: true,
    },
    {
      type: 'string',
      name: 'description',
      allowNull: true,
    },
    {
      type: 'belongsTo',
      name: 'collection',
      target: 'collections',
      foreignKey: 'collectionName',
      targetKey: 'name',
      onDelete: 'CASCADE',
    },
    {
      type: 'hasMany',
      name: 'children',
      target: 'fields',
      sourceKey: 'key',
      foreignKey: 'parentKey',
    },
    {
      type: 'hasOne',
      name: 'reverseField',
      target: 'fields',
      sourceKey: 'key',
      foreignKey: 'reverseKey',
    },
    {
      type: 'json',
      name: 'options',
      defaultValue: {},
      translation: true,
    },
  ],
} as CollectionOptions;
