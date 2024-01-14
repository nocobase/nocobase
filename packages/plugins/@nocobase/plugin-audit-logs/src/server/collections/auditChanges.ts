import { defineCollection } from '@nocobase/database';

export default defineCollection({
  dumpRules: {
    group: 'log',
  },
  name: 'auditChanges',
  title: '变动值',
  createdBy: false,
  updatedBy: false,
  createdAt: false,
  updatedAt: false,
  shared: true,
  fields: [
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
    {
      type: 'belongsTo',
      name: 'log',
      target: 'auditLogs',
      foreignKey: 'auditLogId',
    },
  ],
});
