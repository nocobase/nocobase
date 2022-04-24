import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'applications',
  model: 'ApplicationModel',
  autoGenId: false,
  fields: [
    {
      type: 'uid',
      name: 'name',
      primaryKey: true,
      prefix: 'a',
    },
    {
      type: 'json',
      name: 'options',
    },
  ],
});
