import { TableOptions } from '@nocobase/database';

export default {
  name: 'views_pages_v2',
  title: '视图子页面',
  internal: true,
  // model: 'BaseModelV2',
  developerMode: true,
  createdAt: false,
  updatedAt: false,
  fields: [
    {
      interface: 'string',
      type: 'string',
      name: 'title',
      title: '页面名称',
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
