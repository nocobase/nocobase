import { TableOptions } from '@nocobase/database';

export default {
  name: 'views',
  title: '视图配置',
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
      title: '视图名称',
      showInTable: true,
      showInDetail: true,
      showInForm: true,
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
      showInTable: true,
      showInDetail: true,
      showInForm: true,
      component: {
        type: 'string',
      },
    },
    {
      interface: 'radio',
      type: 'string',
      name: 'type',
      title: '视图类型',
      showInTable: true,
      showInDetail: true,
      showInForm: true,
      component: {
        type: 'radio',
        options: [
          { label: '表格', value: 'table' },
          { label: '看板', value: 'kanban', disabled: true },
          { label: '日历', value: 'calendar', disabled: true },
          { label: '地图', value: 'map', disabled: true },
        ],
      },
    },
    {
      interface: 'string',
      type: 'string',
      name: 'template',
      title: '模板',
      showInTable: true,
      showInDetail: true,
      showInForm: true,
      component: {
        type: 'string',
      },
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'default',
      title: '默认视图',
      showInTable: true,
      showInDetail: true,
      showInForm: true,
      defaultValue: false,
      component: {
        type: 'checkbox',
      },
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'showInDataMenu',
      title: '作为数据表子菜单',
      showInTable: true,
      showInDetail: true,
      showInForm: true,
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
      defaultValue: {},
      component: {
        type: 'hidden',
      },
    },
    // 以下暂不考虑
    // {
    //   type: 'belongsToMany',
    //   name: 'fields',
    //   component: {
    //     type: 'drawerSelect',
    //   },
    // },
    // {
    //   type: 'belongsToMany',
    //   name: 'actions',
    //   component: {
    //     type: 'drawerSelect',
    //   },
    // },
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
