import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'rolesResourcesActions',
  model: 'RoleResourceActionModel',
  fields: [
    {
      type: 'belongsTo',
      name: 'resource',
      foreignKey: 'rolesResourceId',
      target: 'rolesResources',
    },
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'json',
      name: 'fields',
      defaultValue: [],
    },
    {
      type: 'belongsTo',
      name: 'scope',
      target: 'rolesResourcesScopes',
    },
  ],
} as CollectionOptions;
