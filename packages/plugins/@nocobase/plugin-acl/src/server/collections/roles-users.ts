import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'rolesUsers',
  duplicator: {
    dataType: 'business',
  },
  fields: [{ type: 'boolean', name: 'default' }],
} as CollectionOptions;
