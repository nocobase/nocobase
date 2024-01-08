import { defineCollection } from '@nocobase/database';

export default defineCollection({
  dumpRules: {
    group: 'log',
  },
  shared: true,
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
