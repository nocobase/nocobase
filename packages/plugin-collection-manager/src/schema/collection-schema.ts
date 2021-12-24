import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'collections',
  title: '数据表配置',
  sortable: 'sort',
  autoGenId: false,
  repository: 'CollectionRepository',
  model: 'CollectionModel',
  fields: [
    {
      type: 'uid',
      name: 'key',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'name',
      unique: true,
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
      sourceKey: 'key',
    },
  ],
} as CollectionOptions;
