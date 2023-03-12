import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'categories',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'expression',
      name: 'dexp'
    }
  ],
} as CollectionOptions;
