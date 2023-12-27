import { CollectionOptions } from '@nocobase/database';

export default {
  duplicator: {
    dataType: 'business',
  },
  name: 'jobs',
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
