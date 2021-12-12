import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'collections',
  title: '数据表配置',
  sortable: 'sort',
  fields: [
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
      target: 'fields',
      sourceKey: 'name',
    },
  ],
} as CollectionOptions;
