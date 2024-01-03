import { CollectionOptions } from '@nocobase/database';

export default {
  dumpRules: 'required',
  name: 'flow_nodes',
  shared: true,
  fields: [
    {
      type: 'uid',
      name: 'key',
    },
    {
      type: 'string',
      name: 'title',
    },
    // which workflow belongs to
    {
      name: 'workflow',
      type: 'belongsTo',
    },
    {
      name: 'upstream',
      type: 'belongsTo',
      target: 'flow_nodes',
    },
    {
      name: 'branches',
      type: 'hasMany',
      target: 'flow_nodes',
      sourceKey: 'id',
      foreignKey: 'upstreamId',
    },
    // only works when upstream node is branching type, such as condition and parallel.
    // put here because the design of flow-links model is not really necessary for now.
    // or it should be put into flow-links model.
    {
      name: 'branchIndex',
      type: 'integer',
    },
    // Note: for reasons:
    // 1. redirect type node to solve cycle flow.
    // 2. recognize as real next node after branches.
    {
      name: 'downstream',
      type: 'belongsTo',
      target: 'flow_nodes',
    },
    {
      type: 'string',
      name: 'type',
    },
    {
      type: 'json',
      name: 'config',
      defaultValue: {},
    },
  ],
} as CollectionOptions;
