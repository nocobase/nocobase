import { TableOptions } from '@nocobase/database';

export default {
  name: 'views_actions_v2',
  title: '视图操作配置',
  internal: true,
  // model: 'BaseModelV2',
  developerMode: true,
  createdAt: false,
  updatedAt: false,
  fields: [
    {
      interface: 'radio',
      type: 'string',
      name: 'type',
      title: '操作类型',
      dataSource: [
        { label: '新增', value: 'create' },
        { label: '编辑', value: 'update' },
        { label: '删除', value: 'destroy' },
      ],
      component: {
        type: 'radio',
      },
    },
    {
      interface: 'string',
      type: 'string',
      name: 'name',
      title: '操作ID',
      component: {
        type: 'string',
      },
    },
    {
      interface: 'string',
      type: 'string',
      name: 'title',
      title: '操作名称',
      component: {
        type: 'string',
      },
    },
  ],
  views_v2: [
    {
      type: 'table',
      name: 'table',
      title: '全部数据',
      labelField: 'title',
      actions: [
        {
          name: 'create',
          type: 'create',
          title: '新增',
          viewName: 'form',
        },
        {
          name: 'destroy',
          type: 'destroy',
          title: '删除',
        },
      ],
      fields: [
        'type',
        'title',
      ],
      detailsOpenMode: 'drawer', // window
      details: ['form'],
      sort: ['id'],
    },
    {
      type: 'form',
      name: 'form',
      title: '表单',
      fields: [
        'type',
        'title',
      ],
    },
  ],
  pages_v2: [
    {
      title: '表格',
      name: 'all',
      views: ['table'],
    },
    {
      title: '表单',
      name: 'form',
      views: ['form'],
    },
  ],
} as TableOptions;
