import { TableOptions } from '@nocobase/database';

export default {
  name: 'action_changes',
  title: '变动值',
  createdBy: false,
  updatedBy: false,
  createdAt: false,
  updatedAt: false,
  fields: [
    {
      type: 'belongsTo',
      name: 'log',
      target: 'action_logs',
    },
    {
      type: 'jsonb',
      name: 'field',
    },
    {
      type: 'jsonb',
      name: 'before',
    },
    {
      type: 'jsonb',
      name: 'after',
    }
  ],
} as TableOptions;
