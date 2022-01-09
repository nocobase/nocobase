import { TableOptions } from '@nocobase/database';

export default {
  name: 'flow_nodes',
  // model: 'FlowNodeModel',
  title: 'Workflow Nodes',
  fields: [
    {
      interface: 'string',
      type: 'string',
      name: 'title',
      title: '名称',
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
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
    // only works when upstream node is condition type.
    // put here because the design of flow-links model is not really necessary for now.
    // or it should be put into flow-links model.
    {
      name: 'when',
      type: 'boolean',
      // defaultValue: null
    },
    {
      interface: 'select',
      type: 'string',
      name: 'type',
      title: '类型',
      dataSource: [
        { label: '无处理', value: 'echo' },
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
      title: '配置'
    }
  ]
} as TableOptions;
