import { TableOptions } from '../../src';

export default {
  name: 'tags',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'belongsToMany',
      name: 'posts',
    },
  ],
} as TableOptions;