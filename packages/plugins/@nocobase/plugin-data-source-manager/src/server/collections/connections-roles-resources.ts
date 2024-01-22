import { defineCollection } from '@nocobase/database';

export default defineCollection({
  dumpRules: 'required',
  name: 'connectionsRolesResources',
  model: 'ConnectionsRolesResourcesModel',
  fields: [
    {
      type: 'belongsTo',
      name: 'connection',
      target: 'databaseConnections',
      foreignKey: 'connectionName',
      onDelete: 'CASCADE',
    },
    {
      type: 'belongsTo',
      name: 'role',
      target: 'roles',
      foreignKey: 'roleName',
      onDelete: 'CASCADE',
    },
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'boolean',
      name: 'usingActionsConfig',
    },
    {
      type: 'hasMany',
      name: 'actions',
      target: 'connectionsRolesResourcesActions',
    },
  ],
});
