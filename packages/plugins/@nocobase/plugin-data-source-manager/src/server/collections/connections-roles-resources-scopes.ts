import { defineCollection } from '@nocobase/database';

export default defineCollection({
  dumpRules: 'required',
  name: 'connectionsRolesResourcesScopes',
  fields: [
    {
      type: 'uid',
      name: 'key',
    },
    {
      type: 'belongsTo',
      name: 'connection',
      target: 'databaseConnections',
      foreignKey: 'connectionName',
      onDelete: 'CASCADE',
    },
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'string',
      name: 'resourceName',
    },
    {
      type: 'json',
      name: 'scope',
    },
  ],
});
