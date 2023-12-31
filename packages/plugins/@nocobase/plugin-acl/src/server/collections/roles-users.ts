import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'rolesUsers',
  dumpRules: {
    group: 'user',
  },
  fields: [{ type: 'boolean', name: 'default' }],
} as CollectionOptions;
