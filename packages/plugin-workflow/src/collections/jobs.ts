import { TableOptions } from '@nocobase/database';

export default {
  name: 'jobs',
  title: '流程记录',
  fields: [
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'execution',
      title: '所属流程'
    },
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'node',
      target: 'flow_nodes',
      title: '所属节点'
    },
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'upstream',
      target: 'jobs',
      title: '上游记录'
    },
    // pending / resolved / rejected
    {
      interface: 'status',
      type: 'integer',
      name: 'status',
      title: '处理状态'
    },
    {
      interface: 'json',
      type: 'jsonb',
      name: 'result',
      title: '处理结果'
    },
    // TODO: possibly need node snapshot in case if node has been changed
    // {
    //   interface: 'json',
    //   type: 'jsonb',
    //   name: 'nodeSnapshot',
    //   title: 'node snapshot'
    // }
  ]
} as TableOptions;
