import { CollectionOptions } from '@nocobase/database';

export default {
  dumpRules: 'required',
  shared: true,
  name: 'collections',
  sortable: 'sort',
  autoGenId: false,
  model: 'CollectionModel',
  repository: 'CollectionRepository',
  timestamps: false,
  filterTargetKey: 'name',
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
      translation: true,
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
      type: 'string',
      name: 'description',
      allowNull: true,
    },
    {
      type: 'hasMany',
      name: 'fields',
      target: 'fields',
      sourceKey: 'name',
      targetKey: 'name',
      foreignKey: 'collectionName',
      sortBy: 'sort',
    },
    {
      type: 'belongsToMany',
      name: 'category',
      target: 'collectionCategories',
      sourceKey: 'name',
      foreignKey: 'collectionName',
      otherKey: 'categoryId',
      targetKey: 'id',
      sortBy: 'sort',
      through: 'collectionCategory',
    },
  ],
} as CollectionOptions;
