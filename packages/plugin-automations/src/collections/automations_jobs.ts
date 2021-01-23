import { TableOptions } from '@nocobase/database';

export default {
  name: 'automations_jobs',
  title: '任务',
  fields: [
    {
      interface: 'string',
      type: 'string',
      name: 'title',
      title: '任务名称',
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'select',
      type: 'string',
      name: 'type',
      title: '任务类型',
      dataSource: [
        { label: '新增数据', value: 'create' },
        { label: '更新数据', value: 'update' },
        { label: '删除数据', value: 'destroy' },
        { label: '发送通知', value: 'message' },
      ],
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'collection',
      title: '操作数据表',
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'json',
      type: 'json',
      name: 'filter',
      title: '满足以下条件的数据才会被操作',
      component: {
        type: 'filter',
        showInDetail: true,
        showInForm: true,
      },
    },
  ],
  views: [
    {
      type: 'form',
      name: 'form',
      title: '表单',
      template: 'DrawerForm',
      developerMode: true,
    },
    {
      type: 'details',
      name: 'details',
      title: '详情',
      template: 'Details',
      actionNames: ['update'],
      developerMode: true,
    },
    {
      type: 'table',
      name: 'table',
      title: '全部数据',
      template: 'Table',
      mode: 'simple',
      actionNames: ['destroy', 'create'],
      default: true,
      draggable: true,
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
  ],
} as TableOptions;
