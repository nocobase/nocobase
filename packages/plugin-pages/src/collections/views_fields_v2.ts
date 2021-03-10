import { TableOptions } from '@nocobase/database';

export default {
  name: 'views_fields_v2',
  title: '视图字段配置',
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
      title: '字段名称',
      component: {
        type: 'string',
      },
    },
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'field',
      target: 'fields',
      title: '字段',
      labelField: 'title',
      valueField: 'id',
      multiple: false,
      component: {
        type: 'drawerSelect',
        'x-component-props': {
          viewName: 'fields.table',
          resourceName: 'fields',
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
          name: 'add',
          type: 'add',
          title: '新增',
          transform: {
            'data': 'field',
            'data.title': 'title',
          },
          viewName: 'fields.table',
        },
        {
          name: 'destroy',
          type: 'destroy',
          title: '删除',
        },
      ],
      fields: [
        'title',
        'field',
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
        'field',
      ],
    },
  ],
} as TableOptions;
