import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'rolesResourcesActions',
  fields: [
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
