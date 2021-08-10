import { TableOptions } from '@nocobase/database';

export default {
  name: 'scopes',
  sortable: 'sort',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'json',
      name: 'filter',
    },
    {
      type: 'belongsTo',
      name: 'collection',
    },
  ],
} as TableOptions;
