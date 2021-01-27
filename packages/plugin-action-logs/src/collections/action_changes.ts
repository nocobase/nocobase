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
        showInTable: true,
      },
    },
    {
      type: 'jsonb',
      name: 'before',
      title: '操作前',
      component: {
        showInTable: true,
      },
    },
    {
      type: 'jsonb',
      name: 'after',
      title: '操作后',
      component: {
        showInTable: true,
      },
    }
  ],
  views: [
    {
      type: 'table',
      name: 'table',
      title: '列表',
      template: 'Table',
      default: true,
    },
  ],
} as TableOptions;
