import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'databaseConnections',
  duplicator: 'required',
  model: 'DatabaseConnectionModel',
  autoGenId: false,
  fields: [
    {
      type: 'string',
      name: 'name',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'description',
    },
    {
      type: 'json',
      name: 'options',
    },
    {
      type: 'hasMany',
      name: 'collections',
      target: 'remoteCollections',
      foreignKey: 'connectionName',
    },
    {
      type: 'hasMany',
      name: 'connectionsRolesResourcesScopes',
      target: 'connectionsRolesResourcesScopes',
      foreignKey: 'connectionName',
    },
  ],
});
