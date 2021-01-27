import { TableOptions } from '@nocobase/database';

export default {
  name: 'action_logs',
  title: '操作记录',
  developerMode: true,
  internal: true,
  createdBy: false,
  updatedBy: false,
  fields: [
    {
      interface: 'createdAt',
      name: 'created_at',
      type: 'date',
      title: '操作时间',
      showTime: true,
      component: {
        showInTable: true,
        showInDetail: true,
      },
    },
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'user',
      target: 'users',
      title: '操作用户',
      appends: true,
      labelField: 'nickname',
      component: {
        showInTable: true,
        showInDetail: true,
      },
    },
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'collection',
      target: 'collections',
      title: '数据表',
      targetKey: 'name',
      appends: true,
      labelField: 'title',
      component: {
        showInTable: true,
        showInDetail: true,
      },
    },
    {
      interface: 'select',
      type: 'string',
      name: 'type',
      title: '操作类型',
      filterable: true,
      dataSource: [
        { value: 'create', label: '新增' },
        { value: 'update', label: '更新' },
        { value: 'destroy', label: '删除' },
      ],
      component: {
        showInTable: true,
        showInDetail: true,
      },
    },
    {
      interface: 'subTable',
      type: 'hasMany',
      name: 'changes',
      title: '数据变动',
      component: {
        showInDetail: true,
      },
    }
  ],
  actions: [
    {
      type: 'list',
      name: 'list',
      title: '查看',
    },
  ],
  views: [
    {
      type: 'table',
      name: 'table',
      title: '列表',
      template: 'Table',
      default: true
    },
    {
      type: 'details',
      name: 'details',
      title: '详情',
      template: 'Details',
    },
  ],
} as TableOptions;
