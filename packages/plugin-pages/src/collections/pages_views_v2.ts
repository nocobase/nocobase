import { TableOptions } from '@nocobase/database';

export default {
  name: 'pages_views_v2',
  title: '页面视图',
  // internal: true,
  // model: 'BaseModelV2',
  developerMode: false,
  createdAt: false,
  updatedAt: false,
  fields: [
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'view',
      target: 'views_v2',
      title: '视图',
      labelField: 'title',
      valueField: 'id',
      multiple: false,
      component: {
        type: 'drawerSelect',
        'x-component-props': {
          viewName: 'views_v2.table',
          resourceName: 'views_v2',
          labelField: 'title',
          valueField: 'id',
        },
      },
    },
    {
      interface: 'radio',
      type: 'string',
      name: 'width',
      title: '宽度',
      dataSource: [
        { label: '50%', value: '50%' },
        { label: '100%', value: '100%' },
      ],
      component: {
        type: 'radio',
      },
    }
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
        'view',
        'width'
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
        'view',
        'width'
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
