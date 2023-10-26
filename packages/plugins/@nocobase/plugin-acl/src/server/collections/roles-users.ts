import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'rolesUsers',
  duplicator: {
    dataType: 'business',
  },
  namespace: 'acl.acl',
  fields: [{ type: 'boolean', name: 'default' }],
} as CollectionOptions;
