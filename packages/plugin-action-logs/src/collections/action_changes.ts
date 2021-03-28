import { TableOptions } from '@nocobase/database';

export default {
  name: 'action_changes',
  title: '变动值',
  developerMode: true,
  internal: true,
  createdBy: false,
  updatedBy: false,
  createdAt: false,
  updatedAt: false,
  logging: false,
  fields: [
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'log',
      target: 'action_logs',
      title: '所属操作'
    },
    {
      type: 'jsonb',
      name: 'field',
      title: '字段信息',
      component: {
        type: 'logs.field',
        showInTable: true,
      },
    },
    {
      type: 'jsonb',
      name: 'before',
      title: '操作前',
      component: {
        type: 'logs.fieldValue',
        showInTable: true,
      },
    },
    {
      type: 'jsonb',
      name: 'after',
      title: '操作后',
      component: {
        type: 'logs.fieldValue',
        showInTable: true,
      },
    }
  ],
  actions: [
    {
      type: 'list',
      name: 'list',
      title: '查看'
    }
  ],
  views_v2: [
    {
      type: 'table',
      name: 'table',
      fields: [
        'field',
        'before',
        'after',
      ],
    }
  ],
} as TableOptions;
