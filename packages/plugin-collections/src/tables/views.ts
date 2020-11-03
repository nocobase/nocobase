import { TableOptions } from '@nocobase/database';

export default {
  name: 'views',
  title: '视图配置',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'string',
      name: 'type',
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
