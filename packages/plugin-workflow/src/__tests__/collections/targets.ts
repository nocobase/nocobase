import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'targets',
  fields: [
    {
      type: 'string',
      name: 'col1',
    },
    {
      type: 'string',
      name: 'col2',
    }
  ],
} as CollectionOptions;
