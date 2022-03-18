import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'flow_nodes',
  // model: 'FlowNodeModel',
  title: 'Workflow Nodes',
  fields: [
    {
      interface: 'string',
      type: 'string',
      name: 'title',
      title: '名称'
    },
    // which workflow belongs to
    {
      interface: 'linkTo',
      name: 'workflow',
      type: 'belongsTo',
    },
    {
      interface: 'linkTo',
      name: 'upstream',
      type: 'belongsTo',
      target: 'flow_nodes'
    },
    {
      interface: 'linkTo',
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
      interface: 'select',
      name: 'branchIndex',
      type: 'integer',
      title: 'branch index'
    },
    // for reasons:
    // 1. redirect type node to solve cycle flow.
    // 2. recognize as real next node after branches.
    {
      interface: 'linkTo',
      name: 'downstream',
      type: 'belongsTo',
      target: 'flow_nodes'
    },
    {
      interface: 'select',
      type: 'string',
      name: 'type',
      title: '类型',
      // TODO: data for test only now
      dataSource: [
        { label: '数据处理', value: 'data' },
        { label: '数据查询', value: 'query' },
        { label: '等待人工输入', value: 'prompt' },
        { label: '条件判断', value: 'condition' },
      ]
    },
    {
      interface: 'json',
      type: 'jsonb',
      name: 'config',
      title: '配置',
      defaultValue: {}
    }
  ]
} as CollectionOptions;
