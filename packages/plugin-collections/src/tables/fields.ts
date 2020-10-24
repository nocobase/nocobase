import { TableOptions } from '@nocobase/database';

export default {
  name: 'fields',
  title: '字段配置',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'string',
      name: 'type',
    },
    {
      type: 'json',
      name: 'options',
    },
    {
      type: 'belongsTo',
      name: 'collection',
    },
  ],
} as TableOptions;
