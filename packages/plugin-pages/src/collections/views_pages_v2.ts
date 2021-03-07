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
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'page',
      target: 'pages_v2',
      title: '关联的页面',
      labelField: 'title',
      valueField: 'id',
      multiple: false,
      component: {
        type: 'drawerSelect',
        'x-component-props': {
          viewName: 'pages_v2.collection_pages',
          resourceName: 'pages_v2',
          labelField: 'title',
          valueField: 'id',
        },
      },
    },
  ],
  views_v2: [
    {
      developerMode: true,
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
        'page',
      ],
      detailsOpenMode: 'drawer', // window
      details: ['form'],
      sort: ['id'],
    },
    {
      developerMode: true,
      type: 'form',
      name: 'form',
      title: '表单',
      fields: [
        'title',
        'page',
      ],
    },
  ],
  pages_v2: [
    {
      developerMode: true,
      title: '表格',
      name: 'all',
      views: ['table'],
    },
    {
      developerMode: true,
      title: '表单',
      name: 'form',
      views: ['form'],
    },
  ],
} as TableOptions;
