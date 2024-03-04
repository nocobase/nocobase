import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'dataSources',
  model: 'DataSourceModel',
  autoGenId: false,
  shared: true,
  dumpRules: 'required',
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
      type: 'string',
      name: 'type',
    },
    {
      type: 'json',
      name: 'options',
    },
    {
      type: 'boolean',
      name: 'enabled',
      defaultValue: true,
    },
    {
      type: 'boolean',
      name: 'fixed',
      defaultValue: false,
    },
    {
      type: 'hasMany',
      name: 'collections',
      target: 'dataSourcesCollections',
      foreignKey: 'dataSourceKey',
    },
    {
      type: 'hasMany',
      name: 'rolesResourcesScopes',
      target: 'dataSourcesRolesResourcesScopes',
      foreignKey: 'dataSourceKey',
    },
  ],
});
