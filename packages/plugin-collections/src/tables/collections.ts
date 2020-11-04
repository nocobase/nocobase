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
      type: 'hasMany',
      name: 'fields',
    },
    {
      type: 'hasMany',
      name: 'actions',
    },
    {
      type: 'hasMany',
      name: 'tabs',
    },
    {
      type: 'hasMany',
      name: 'views',
    },
  ],
  actions: [
    {
      type: 'list',
      name: 'list',
      title: '查看',
    },
    {
      type: 'create',
      name: 'create',
      title: '创建',
    },
    {
      type: 'update',
      name: 'update',
      title: '编辑',
    },
    {
      type: 'destroy',
      name: 'destroy',
      title: '删除',
    },
  ],
  views: [
    {
      type: 'form',
      name: 'form',
      title: '表单',
      template: 'Form',
    },
    {
      type: 'details',
      name: 'details',
      title: '详情',
      template: 'Details',
    },
    {
      type: 'simple',
      name: 'simple',
      title: '简易模式',
      template: 'SimpleTable',
    },
    {
      type: 'table',
      name: 'table',
      title: '列表',
      template: 'Table',
    },
  ],
  tabs: [
    {
      name: 'details',
      title: '详情',
      type: 'details',
      viewName: 'details',
    },
    {
      name: 'fields',
      title: '字段',
      type: 'relation',
      collection: 'fields',
      viewName: 'simple',
    },
    {
      name: 'views',
      title: '视图',
      type: 'relation',
      collection: 'views',
      viewName: 'simple',
    },
    {
      name: 'tabs',
      title: '标签页',
      type: 'relation',
      collection: 'tabs',
      viewName: 'simple',
    },
  ],
} as TableOptions;
