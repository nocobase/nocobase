import { TableOptions } from '@nocobase/database';

export default {
  name: 'executions',
  model: 'ExecutionModel',
  title: '执行流程',
  fields: [
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'workflow',
      title: '所属工作流'
    },
    {
      interface: 'linkTo',
      type: 'hasMany',
      name: 'jobs',
      title: '流程记录'
    },
    {
      interface: 'json',
      type: 'jsonb',
      name: 'context',
      title: '上下文数据'
    },
    {
      interface: 'select',
      type: 'integer',
      name: 'status',
      title: '状态'
    }
  ]
} as TableOptions;
