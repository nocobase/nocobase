import { CollectionOptions } from '@nocobase/client';

export default {
  namespace: 'auth.token-black',
  duplicator: 'optional',
  name: 'tokenBlacklist',
  model: 'TokenBlacklistModel',
  fields: [
    {
      type: 'string',
      name: 'token',
      index: true,
    },
    {
      type: 'date',
      name: 'expiration',
    },
  ],
} as CollectionOptions;
