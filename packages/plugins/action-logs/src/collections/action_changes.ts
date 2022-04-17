import { CollectionOptions } from '@nocobase/database';

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
      foreignKey: 'actionLogId',
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
    },
  ],
} as CollectionOptions;
