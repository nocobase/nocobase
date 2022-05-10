import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'workflows',
  model: 'WorkflowModel',
  title: '自动化',
  fields: [
    {
      name: 'key',
      type: 'uid'
    },
    {
      interface: 'string',
      type: 'string',
      name: 'title',
      title: '工作流名称',
      required: true
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'enabled',
      title: '启用',
      defaultValue: false
    },
    {
      interface: 'textarea',
      type: 'text',
      name: 'description',
      title: '描述'
    },
    {
      interface: 'select',
      type: 'string',
      title: '触发方式',
      name: 'type',
      required: true
    },
    {
      interface: 'json',
      type: 'jsonb',
      title: '触发配置',
      name: 'config',
      required: true,
      defaultValue: {}
    },
    {
      interface: 'boolean',
      type: 'boolean',
      title: '使用事务',
      name: 'useTransaction',
      defaultValue: true
    },
    {
      interface: 'linkTo',
      type: 'hasMany',
      name: 'nodes',
      target: 'flow_nodes',
      title: '流程节点'
    },
    {
      interface: 'linkTo',
      type: 'hasMany',
      name: 'executions',
      target: 'executions',
      title: '触发执行'
    },
    {
      type: 'boolean',
      name: 'executed',
      defaultValue: false
    },
    {
      type: 'boolean',
      name: 'current',
      defaultValue: false
    }
  ]
} as CollectionOptions;
