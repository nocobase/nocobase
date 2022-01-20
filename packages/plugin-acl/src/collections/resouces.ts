import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'rolesResources',
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
