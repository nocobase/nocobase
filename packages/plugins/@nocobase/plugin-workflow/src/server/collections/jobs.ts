import { CollectionOptions } from '@nocobase/database';

export default {
  dumpRules: {
    group: 'log',
  },
  name: 'jobs',
  shared: true,
  fields: [
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
      type: 'string',
      name: 'nodeKey',
    },
    {
      type: 'belongsTo',
      name: 'upstream',
      target: 'jobs',
    },
    {
      type: 'integer',
      name: 'status',
    },
    {
      type: 'json',
      name: 'result',
    },
  ],
} as CollectionOptions;
