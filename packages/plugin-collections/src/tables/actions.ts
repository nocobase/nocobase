import { TableOptions } from '@nocobase/database';

export default {
  name: 'actions',
  title: '操作配置',
  fields: [
    {
      type: 'string',
      name: 'type',
      title: '类型',
    },
    {
      type: 'string',
      name: 'name',
      title: '标识',
    },
    {
      type: 'string',
      name: 'title',
      title: '名称',
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
      actions: ['update'],
    },
    {
      type: 'simple',
      name: 'simple',
      title: '简易模式',
      template: 'SimpleTable',
      actions: ['create', 'delete'],
    },
    {
      type: 'table',
      name: 'table',
      title: '列表',
      template: 'Table',
      actions: ['create', 'delete'],
    },
  ],
} as TableOptions;
