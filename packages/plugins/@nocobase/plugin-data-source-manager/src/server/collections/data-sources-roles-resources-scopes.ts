import { defineCollection } from '@nocobase/database';

export default defineCollection({
  dumpRules: 'required',
  name: 'dataSourcesRolesResourcesScopes',
  fields: [
    {
      type: 'uid',
      name: 'key',
    },
    {
      name: 'dataSourceKey',
      type: 'string',
      defaultValue: 'main',
    },
    {
      type: 'belongsTo',
      name: 'dataSources',
      foreignKey: 'dataSourceKey',
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
