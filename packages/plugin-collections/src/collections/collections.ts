import { TableOptions } from '@nocobase/database';

export default {
  name: 'collections',
  title: '数据表配置',
  model: 'Collection',
  fields: [
    {
      type: 'sort',
      name: 'sort',
    },
    {
      type: 'uid',
      name: 'name',
      primaryKey: true,
      prefix: 't_',
    },
    {
      type: 'string',
      name: 'title',
      required: true,
    },
    {
      type: 'json',
      name: 'options',
      defaultValue: {},
    },
    {
      type: 'hasMany',
      name: 'fields',
      sourceKey: 'name',
    },
  ],
} as TableOptions;
