import { TableOptions } from '@nocobase/database';

export default {
  name: 'tests',
  fields: [
    {
      type: 'string',
      name: 'name1',
    },
    {
      type: 'string',
      name: 'name2',
    }
  ],
} as TableOptions;
