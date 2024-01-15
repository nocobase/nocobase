import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'users_jobs',
  dumpRules: {
    group: 'log',
  },
  shared: true,
  fields: [
    {
      type: 'bigInt',
      name: 'id',
      primaryKey: true,
      autoIncrement: true,
    },
    {
      type: 'belongsTo',
      name: 'job',
      target: 'jobs',
      foreignKey: 'jobId',
      primaryKey: false,
    },
    {
      type: 'belongsTo',
      name: 'user',
      target: 'users',
      foreignKey: 'userId',
      primaryKey: false,
    },
    {
      type: 'belongsTo',
      name: 'execution',
    },
    {
      type: 'belongsTo',
      name: 'node',
      target: 'flow_nodes',
    },
    {
      type: 'belongsTo',
      name: 'workflow',
    },
    {
      type: 'integer',
      name: 'status',
    },
    {
      type: 'jsonb',
      name: 'result',
    },
  ],
});
