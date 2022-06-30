import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'auditLogs',
  createdBy: false,
  updatedBy: false,
  updatedAt: false,
  fields: [
    {
      type: 'date',
      name: 'createdAt',
    },
    {
      type: 'string',
      name: 'type',
    },
    {
      type: 'string',
      name: 'recordId',
      index: true,
    },
    {
      type: 'string',
      name: 'collectionName',
    },
    {
      type: 'belongsTo',
      name: 'collection',
      target: 'collections',
      targetKey: 'name',
      sourceKey: 'id',
      foreignKey: 'collectionName',
      constraints: false,
    },
    {
      type: 'hasMany',
      name: 'changes',
      target: 'auditChanges',
      foreignKey: 'auditLogId',
    },
    {
      type: 'belongsTo',
      name: 'user',
      target: 'users',
    },
  ],
});
