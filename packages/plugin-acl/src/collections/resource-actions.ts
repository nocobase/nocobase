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
      type: 'array',
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
