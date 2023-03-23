import { defineCollection } from '@nocobase/database';

export default defineCollection({
  namespace: 'audit-logs.auditLogs',
  duplicator: 'optional',
  name: 'auditChanges',
  title: '变动值',
  createdBy: false,
  updatedBy: false,
  createdAt: false,
  updatedAt: false,
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
