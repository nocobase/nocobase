import { extendCollection } from '@nocobase/database';

export default extendCollection({
  name: 'categories',
  fields: [
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
  ],
});
