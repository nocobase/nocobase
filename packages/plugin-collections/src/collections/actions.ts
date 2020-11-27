import { TableOptions } from '@nocobase/database';

export default {
  name: 'actions',
  title: '操作配置',
  sortable: true,
  fields: [
    {
      interface: 'sort',
      type: 'integer',
      name: 'sort',
      title: '排序',
      showInTable: true,
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
      showInForm: true,
      showInTable: true,
      showInDetail: true,
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
      showInForm: true,
      showInTable: true,
      showInDetail: true,
      component: {
        type: 'string',
      },
    },
    {
      interface: 'string',
      type: 'string',
      name: 'type',
      title: '类型',
      showInForm: true,
      showInTable: true,
      showInDetail: true,
      component: {
        type: 'string',
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
      defaultValue: {},
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
