import { TableOptions } from '@nocobase/database';

export default {
  name: 'views',
  title: '视图配置',
  fields: [
    {
      type: 'integer',
      name: 'sort',
      title: '排序',
      component: {
        type: 'sort',
        className: 'drag-visible',
      },
    },
    {
      type: 'string',
      name: 'type',
      title: '类型',
      component: {
        type: 'string',
        className: 'drag-visible',
      },
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
      type: 'string',
      name: 'template',
      title: '模板',
    },
    {
      type: 'boolean',
      name: 'default',
      title: '默认视图',
      defaultValue: false,
    },
    {
      type: 'json',
      name: 'options',
    },
    {
      type: 'belongsTo',
      name: 'collection',
      target: 'collections',
      targetKey: 'name',
    },
    {
      type: 'belongsToMany',
      name: 'fields',
    },
    {
      type: 'belongsToMany',
      name: 'actions',
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
      viewName: 'form',
    },
    {
      type: 'update',
      name: 'update',
      title: '编辑',
      viewName: 'form',
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
      template: 'DrawerForm',
    },
    {
      type: 'details',
      name: 'details',
      title: '详情',
      template: 'Details',
      actionNames: ['update'],
    },
    {
      type: 'table',
      name: 'simple',
      title: '简易模式',
      template: 'SimpleTable',
      default: true,
      actionNames: ['create', 'destroy'],
      detailsViewName: 'details',
      updateViewName: 'form',
    },
    {
      type: 'table',
      name: 'table',
      title: '列表',
      template: 'Table',
      actionNames: ['create', 'destroy'],
    },
  ],
} as TableOptions;
