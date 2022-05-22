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
      type: 'string',
      name: 'title',
      title: '工作流名称',
      required: true
    },
    {
      type: 'boolean',
      name: 'enabled',
      title: '启用',
      defaultValue: false
    },
    {
      type: 'text',
      name: 'description',
      title: '描述'
    },
    {
      type: 'string',
      title: '触发方式',
      name: 'type',
      required: true
    },
    {
      type: 'jsonb',
      title: '触发配置',
      name: 'config',
      required: true,
      defaultValue: {}
    },
    {
      type: 'boolean',
      title: '使用事务',
      name: 'useTransaction',
      defaultValue: true
    },
    {
      type: 'hasMany',
      name: 'nodes',
      target: 'flow_nodes',
      title: '流程节点'
    },
    {
      type: 'hasMany',
      name: 'executions',
      target: 'executions',
      title: '触发执行'
    },
    {
      type: 'integer',
      name: 'executed',
      defaultValue: 0
    },
    {
      type: 'boolean',
      name: 'current',
      defaultValue: false
    },
    {
      type: 'hasMany',
      name: 'revisions',
      target: 'workflows',
      foreignKey: 'key',
      sourceKey: 'key',
      // NOTE: no constraints needed here because tricky self-referencing
      constraints: false
    }
  ]
} as CollectionOptions;
