import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'users_jobs',
  fields: [
    {
      type: 'integer',
      name: 'id',
      primaryKey: true,
      autoIncrement: true
    },
    {
      type: 'integer',
      name: 'userId',
      primaryKey: false,
    },
    {
      type: 'integer',
      name: 'jobId',
      primaryKey: false,
    },
    {
      type: 'belongsTo',
      name: 'job'
    },
    {
      type: 'belongsTo',
      name: 'user'
    },
    {
      type: 'belongsTo',
      name: 'execution'
    },
    {
      type: 'belongsTo',
      name: 'node',
      target: 'flow_nodes'
    },
    {
      type: 'belongsTo',
      name: 'workflow'
    },
    {
      type: 'integer',
      name: 'status'
    },
    {
      type: 'jsonb',
      name: 'result'
    }
  ]
} as CollectionOptions;
