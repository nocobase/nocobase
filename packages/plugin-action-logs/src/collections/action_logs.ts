import { TableOptions } from '@nocobase/database';
import { LOG_TYPE_CREATE, LOG_TYPE_UPDATE, LOG_TYPE_DESTROY } from '../constants';

export default {
  name: 'action_logs',
  title: '操作记录',
  createdBy: false,
  updatedBy: false,
  updatedAt: false,
  fields: [
    {
      type: 'date',
      name: 'created_at',
    },
    {
      type: 'belongsTo',
      name: 'user',
      target: 'users',
    },
    {
      type: 'string',
      name: 'collection_name',
    },
    {
      type: 'belongsTo',
      name: 'collection',
      target: 'collections',
      targetKey: 'name',
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
      foreignKey: 'action_log_id',
    }
  ],
} as TableOptions;
