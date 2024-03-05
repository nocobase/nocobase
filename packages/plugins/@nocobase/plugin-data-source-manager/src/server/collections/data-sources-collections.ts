import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'dataSourcesCollections',
  model: 'DataSourcesCollectionModel',
  dumpRules: 'required',
  shared: true,
  autoGenId: false,
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['name', 'dataSourceKey'],
    },
  ],
  fields: [
    {
      type: 'uid',
      name: 'key',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'belongsTo',
      name: 'dataSources',
      foreignKey: 'dataSourceKey',
      onDelete: 'CASCADE',
    },
    {
      type: 'json',
      name: 'options',
    },
    {
      type: 'hasMany',
      name: 'fields',
      target: 'dataSourcesFields',
      sourceKey: 'key',
      targetKey: 'key',
      foreignKey: 'collectionKey',
    },
  ],
});
