import { defineCollection, NOW } from '@nocobase/database';

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
      type: 'date',
      name: 'updated_at',
      defaultValue: NOW,
    },
  ],
});
