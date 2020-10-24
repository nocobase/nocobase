import { TableOptions } from '@nocobase/database';
import CollectionModel from '../models/collection';

export default {
  name: 'collections',
  title: '数据表配置',
  model: CollectionModel,
  fields: [
    {
      type: 'string',
      name: 'title',
      showInTable: true,
      required: true,
      component: {
        type: 'string',
        label: '名称',
      },
    },
    {
      type: 'string',
      name: 'name',
      unique: true,
      primaryKey: true,
      autoIncrement: false,
      showInTable: true,
      required: true,
      component: {
        type: 'string',
        label: '标识',
        'x-rules': [
          {
            format: 'slug',
            message: '只允许英文数字和下划线',
          },
        ],
      },
    },
    {
      type: 'string',
      name: 'description',
      component: {
        type: 'textarea',
        label: '描述',
      },
    },
    {
      type: 'json',
      name: 'options',
    },
    {
      name: 'fields',
      type: 'hasMany',
    },
  ],
} as TableOptions;
