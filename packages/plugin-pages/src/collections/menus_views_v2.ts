import { TableOptions } from '@nocobase/database';

export default {
  name: 'menus_views_v2',
  title: '页面视图',
  internal: true,
  // model: 'BaseModelV2',
  developerMode: true,
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
      interface: 'string',
      type: 'virtual',
      name: 'view.collection.title',
      title: '所属数据表',
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
      developerMode: true,
      type: 'table',
      name: 'table',
      title: '全部数据',
      labelField: 'title',
      draggable: true,
      actions: [
        {
          name: 'add',
          type: 'add',
          title: '新增',
          transform: {
            'data': 'view',
            'data.title': 'title',
          },
          viewName: 'views_v2.table',
          filter: {
            and: [
              {'type.ne': 'descriptions'},
              {'data_source_type.ne': 'association'},
            ]
          },
        },
        {
          name: 'destroy',
          type: 'destroy',
          title: '删除',
        },
      ],
      fields: [
        'view',
        'view.collection.title',
        'width'
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
        'view',
        'width'
      ],
    },
    {
      developerMode: true,
      type: 'descriptions',
      name: 'descriptions',
      title: '表单',
      fields: [
        'view',
        'width'
      ],
    },
  ],
} as TableOptions;
