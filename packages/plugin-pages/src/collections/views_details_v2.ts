import { TableOptions } from '@nocobase/database';

export default {
  name: 'views_details_v2',
  title: '详情子视图',
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
      title: '标签页名称',
      component: {
        type: 'string',
      },
    },
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'view',
      target: 'views_v2',
      title: '标签页显示的视图',
      labelField: 'title',
      valueField: 'id',
      multiple: false,
      required: true,
      viewName: 'views_v2.form',
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
          title: '选择',
          transform: {
            'data': 'view',
            'data.title': 'title',
          },
          viewName: 'collections.views_v2.table',
          componentProps: {
            type: 'primary',
          },
          filter: {
            or: [
              { 'type': 'form' },
              { 'type': 'descriptions' },
              { 'data_source_type': 'association' },
            ]
          },
        },
        {
          name: 'create',
          type: 'create',
          title: '新增',
          transform: {
            'data': 'view',
            'data.title': 'title',
          },
          viewName: 'collections.views_v2.form',
          componentProps: {
            type: 'default',
          },
        },
        {
          name: 'destroy',
          type: 'destroy',
          title: '移除',
        },
      ],
      fields: [
        'title',
        'view',
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
        'view',
      ],
    },
  ],
} as TableOptions;
