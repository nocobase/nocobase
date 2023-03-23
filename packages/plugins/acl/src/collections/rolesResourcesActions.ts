import { CollectionOptions } from '@nocobase/database';

export default {
  namespace: 'acl.acl',
  duplicator: 'required',
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
      onDelete: 'RESTRICT',
    },
  ],
} as CollectionOptions;
