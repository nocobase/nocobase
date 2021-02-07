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
    },
    {
      type: 'date',
      name: 'date1',
    },
    {
      type: 'date',
      name: 'date2',
    }
  ],
} as TableOptions;
