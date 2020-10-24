import { TableOptions } from '../../src';

export default {
  name: 'comments',
  fields: [
    {
      type: 'text',
      name: 'content',
    },
    {
      type: 'belongsTo',
      name: 'user',
    },
    {
      type: 'belongsTo',
      name: 'post',
    },
  ],
} as TableOptions;