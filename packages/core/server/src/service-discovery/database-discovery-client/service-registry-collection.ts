import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'service_registry',
  timestamps: false,
  fields: [
    {
      type: 'string',
      name: 'key',
    },
    {
      type: 'string',
      name: 'value',
    },
    {
      type: 'bigInt',
      name: 'updatedAt',
      defaultValue: () => Math.floor(Date.now() / 1000) + 15,
    },
  ],
});
