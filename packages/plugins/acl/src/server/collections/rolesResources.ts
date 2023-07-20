import { CollectionOptions } from '@nocobase/database';

export default {
  namespace: 'acl.acl',
  duplicator: 'required',
  name: 'rolesResources',
  model: 'RoleResourceModel',
  indexes: [
    {
      unique: true,
      fields: ['roleName', 'name'],
    },
  ],
  fields: [
    {
      type: 'belongsTo',
      name: 'role',
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
      target: 'rolesResourcesActions',
    },
  ],
} as CollectionOptions;
