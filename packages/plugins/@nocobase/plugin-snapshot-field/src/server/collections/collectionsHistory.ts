import { CollectionOptions } from '@nocobase/database';

export default {
  dumpRules: 'required',
  name: 'collectionsHistory',
  sortable: 'sort',
  autoGenId: false,
  model: 'CollectionModel',
  repository: 'CollectionRepository',
  timestamps: false,
  filterTargetKey: 'name',
  shared: true,
  fields: [
    {
      type: 'uid',
      name: 'key',
      primaryKey: true,
    },
    {
      type: 'uid',
      name: 'name',
      unique: true,
      prefix: 't_',
    },
    {
      type: 'string',
      name: 'title',
      required: true,
    },
    {
      type: 'boolean',
      name: 'inherit',
      defaultValue: false,
    },
    {
      type: 'boolean',
      name: 'hidden',
      defaultValue: false,
    },
    {
      type: 'json',
      name: 'options',
      defaultValue: {},
    },
    {
      type: 'hasMany',
      name: 'fields',
      target: 'fieldsHistory',
      sourceKey: 'name',
      targetKey: 'name',
      foreignKey: 'collectionName',
      onDelete: 'CASCADE',
      sortBy: 'sort',
    },
  ],
} as CollectionOptions;
