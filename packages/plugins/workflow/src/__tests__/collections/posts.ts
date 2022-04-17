import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'boolean',
      name: 'published',
      defaultValue: false
    },
    {
      type: 'integer',
      name: 'read',
      defaultValue: 0
    }
  ]
} as CollectionOptions;
