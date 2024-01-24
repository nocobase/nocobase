import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'dataSources',
  autoGenId: false,
  fields: [
    {
      type: 'string',
      name: 'key',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'displayName',
    },
    {
      type: 'json',
      name: 'options',
    },
    {
      type: 'hasMany',
      name: 'collections',
      target: 'remoteCollections',
      foreignKey: 'dataSourceKey',
    },
    {
      type: 'hasMany',
      name: 'connectionsRolesResourcesScopes',
      target: 'connectionsRolesResourcesScopes',
      foreignKey: 'dataSourceKey',
    },
  ],
});
