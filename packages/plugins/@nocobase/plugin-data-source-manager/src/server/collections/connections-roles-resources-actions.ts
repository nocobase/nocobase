import { defineCollection } from '@nocobase/database';

export default defineCollection({
  dumpRules: 'required',
  name: 'connectionsRolesResourcesActions',
  model: 'ConnectionsRolesResourcesActionModel',
  fields: [
    {
      type: 'belongsTo',
      name: 'resource',
      foreignKey: 'rolesResourceId',
      target: 'connectionRolesResources',
    },
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'array',
      name: 'fields',
      defaultValue: [],
    },
    {
      type: 'belongsTo',
      name: 'scope',
      target: 'connectionsRolesResourcesScopes',
      onDelete: 'RESTRICT',
    },
  ],
});
