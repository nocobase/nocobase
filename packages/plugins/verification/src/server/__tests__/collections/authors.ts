import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'authors',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'string',
      name: 'phone',
    },
  ],
} as CollectionOptions;
