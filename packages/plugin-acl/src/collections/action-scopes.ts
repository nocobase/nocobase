import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'rolesResourcesScopes',
  fields: [
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
} as CollectionOptions;
