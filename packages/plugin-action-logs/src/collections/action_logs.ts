import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'action_logs',
  title: '操作记录',
  createdBy: false,
  updatedBy: false,
  updatedAt: false,
  fields: [
    {
      type: 'date',
      name: 'createdAt',
    },
    {
      type: 'belongsTo',
      name: 'user',
      target: 'users',
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
      sourceKey: 'collectionName',
      constraints: false,
    },
    {
      type: 'string',
      name: 'type',
    },
    {
      type: 'integer',
      name: 'index',
    },
    {
      type: 'hasMany',
      name: 'changes',
      target: 'action_changes',
      foreignKey: 'actionLogId',
    },
  ],
} as CollectionOptions;
