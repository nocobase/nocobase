import { defineCollection } from '@nocobase/database';

export default defineCollection({
  dumpRules: 'required',
  name: 'dataSourcesRolesResourcesActions',
  model: 'DataSourcesRolesResourcesActionModel',
  fields: [
    {
      type: 'belongsTo',
      name: 'resource',
      foreignKey: 'rolesResourceId',
      target: 'dataSourcesRolesResources',
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
      target: 'dataSourcesRolesResourcesScopes',
      onDelete: 'RESTRICT',
      foreignKey: 'scopeId',
    },
  ],
});
