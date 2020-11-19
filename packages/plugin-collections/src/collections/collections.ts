import { TableOptions } from '@nocobase/database';
import CollectionModel from '../models/collection';

export default {
  name: 'collections',
  title: '数据表配置',
  model: CollectionModel,
  fields: [
    {
      type: 'integer',
      name: 'sort',
      title: '排序',
      component: {
        type: 'sort',
        className: 'drag-visible',
        width: 60,
      },
    },
    {
      type: 'string',
      name: 'title',
      title: '名称',
      showInTable: true,
      required: true,
      component: {
        type: 'string',
        className: 'drag-visible',
      },
    },
    {
      type: 'string',
      name: 'name',
      title: '标识',
      unique: true,
      required: true,
      component: {
        type: 'string',
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
      title: '描述',
      component: {
        type: 'textarea',
      },
    },
    {
      type: 'json',
      name: 'options',
    },
    {
      type: 'hasMany',
      name: 'fields',
      sourceKey: 'name',
    },
    {
      type: 'hasMany',
      name: 'actions',
      sourceKey: 'name',
    },
    {
      type: 'hasMany',
      name: 'tabs',
      sourceKey: 'name',
    },
    {
      type: 'hasMany',
      name: 'views',
      sourceKey: 'name',
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
      default: true,
    },
  ],
  tabs: [
    {
      type: 'details',
      name: 'details',
      title: '详情',
      viewName: 'details',
      default: true,
    },
    {
      type: 'association',
      name: 'fields',
      title: '字段',
      association: 'fields',
      viewName: 'simple',
    },
    {
      type: 'association',
      name: 'views',
      title: '视图',
      association: 'views',
      viewName: 'simple',
    },
    {
      type: 'association',
      name: 'actions',
      title: '动作',
      association: 'actions',
      viewName: 'simple',
    },
    {
      type: 'association',
      name: 'tabs',
      title: '标签页',
      association: 'tabs',
      viewName: 'simple',
    },
    {
      type: 'association',
      name: 'roles',
      title: '权限',
      association: 'roles',
      viewName: 'simple2',
    },
  ],
} as TableOptions;
