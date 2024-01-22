import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'remoteFields',
  model: 'RemoteFieldModel',
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
    },
    {
      type: 'string',
      name: 'collectionName',
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
      type: 'json',
      name: 'uiSchema',
      default: {},
    },
    {
      type: 'belongsTo',
      name: 'collection',
      target: 'remoteCollections',
      foreignKey: 'collectionKey',
      targetKey: 'key',
      onDelete: 'CASCADE',
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
      defaultValue: {},
      translation: true,
    },
  ],
});
