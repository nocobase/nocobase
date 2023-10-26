import { defineCollection } from '@nocobase/database';

export default defineCollection({
  namespace: 'auth.token-black',
  duplicator: {
    dataType: 'business',
  },
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
});
