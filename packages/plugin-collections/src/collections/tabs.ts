import { TableOptions } from '@nocobase/database';

export default {
  name: 'tabs',
  title: '标签配置',
  fields: [
    {
      interface: 'sort',
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
      interface: 'string',
      type: 'string',
      name: 'title',
      title: '名称',
      component: {
        type: 'string',
        className: 'drag-visible',
      },
    },
    {
      interface: 'string',
      type: 'string',
      name: 'name',
      title: '标识',
      component: {
        type: 'string',
      },
    },
    {
      interface: 'radio',
      type: 'string',
      name: 'type',
      title: '类型',
      component: {
        type: 'radio',
        options: [
          { label: '模块组合', value: 'module' },
          { label: '相关数据', value: 'association' },
          { label: '详情数据', value: 'detail' },
        ],
      },
    },
    {
      interface: 'string',
      type: 'virtual',
      name: 'options.association',
      title: '相关数据表',
      component: {
        type: 'string',
      },
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'default',
      title: '默认标签页',
      defaultValue: false,
      component: {
        type: 'checkbox',
      },
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'enabled',
      title: '启动',
      defaultValue: false,
      component: {
        type: 'checkbox',
      },
    },
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'collection',
      title: '所属数据表',
      target: 'collections',
      targetKey: 'name',
      component: {
        type: 'drawerSelect',
      },
    },
    {
      interface: 'json',
      type: 'json',
      name: 'options',
      title: '配置信息',
      component: {
        type: 'hidden',
      },
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
      paginated: false,
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
