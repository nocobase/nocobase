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
      foreignKey: 'action_log_id',
    },
    {
      type: 'json',
      name: 'field',
    },
    {
      type: 'json',
      name: 'before',
    },
    {
      type: 'json',
      name: 'after',
    }
  ],
} as TableOptions;
