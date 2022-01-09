import { TableOptions } from '@nocobase/database';

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
    }
  ]
} as TableOptions;
