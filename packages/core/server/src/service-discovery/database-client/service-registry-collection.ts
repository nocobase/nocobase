import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'service_registry',
  fields: [
    {
      type: 'string',
      name: 'service_name',
    },
    {
      type: 'string',
      name: 'address',
    },
    {
      type: 'datetime',
      name: 'last_updated_at',
    },
  ],
});
