import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'rolesUsers',
  duplicator: 'optional',
  namespace: 'acl.users',
  fields: [{ type: 'boolean', name: 'default' }],
} as CollectionOptions;
