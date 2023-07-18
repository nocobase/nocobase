import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'categories',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'string',
      name: 'engine',
    },
    {
      type: 'string',
      name: 'collection',
    },
    {
      type: 'text',
      name: 'expression',
    },
    {
      type: 'hasMany',
      name: 'posts',
    },
  ],
} as CollectionOptions;
