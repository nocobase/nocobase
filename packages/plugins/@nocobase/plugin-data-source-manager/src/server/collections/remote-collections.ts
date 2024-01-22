import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'remoteCollections',
  model: 'RemoteCollectionModel',
  autoGenId: false,
  timestamps: false,
  fields: [
    {
      type: 'uid',
      name: 'key',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'name',
      unique: true,
    },
    {
      type: 'belongsTo',
      name: 'databaseConnections',
      foreignKey: 'connectionName',
      onDelete: 'CASCADE',
    },
    {
      type: 'json',
      name: 'options',
    },
    {
      type: 'hasMany',
      name: 'fields',
      target: 'remoteFields',
      sourceKey: 'key',
      targetKey: 'key',
      foreignKey: 'collectionKey',
    },
  ],
});
