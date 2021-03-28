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
      viewName: 'views_v2.form',
      component: {
        type: 'drawerSelect',
        'x-component-props': {
          viewName: 'views_v2.table',
          resourceName: 'views_v2',
          labelField: 'title',
          valueField: 'id',
        },
        'x-linkages': [
          {
            "type": "value:visible",
            "target": "returnType",
            "condition": "{{ $self.value && $self.value.type === 'form' }}"
          },
          {
            "type": "value:visible",
            "target": "redirect",
            "condition": "{{ $self.value && $self.value.type === 'form' }}"
          },
          {
            "type": "value:visible",
            "target": "message",
            "condition": "{{ $self.value && $self.value.type === 'form' }}"
          },
          {
            "type": "value:visible",
            "target": "draft.returnType",
            "condition": "{{ $self.value && $self.value.type === 'form' }}"
          },
        ],
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
    },
    {
      interface: 'radio',
      type: 'string',
      name: 'returnType',
      title: '表单提交成功后',
      dataSource: [
        { label: '显示文字信息', value: 'message' },
        { label: '跳转到页面', value: 'redirect' },
      ],
      component: {
        type: 'radio',
        'x-linkages': [
          {
            "type": "value:visible",
            "target": "message",
            "condition": "{{ $self.value === 'message' }}"
          },
          {
            "type": "value:visible",
            "target": "redirect",
            "condition": "{{ $self.value === 'redirect' }}"
          },
        ],
      },
    },
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'redirect',
      target: 'menus',
      title: '跳转到页面',
      labelField: 'title',
      valueField: 'id',
      multiple: false,
      component: {
        type: 'drawerSelect',
        'x-component-props': {
          viewName: 'menus.table',
          resourceName: 'menus',
          labelField: 'title',
          valueField: 'id',
        },
      },
    },
    {
      interface: 'markdown',
      type: 'json',
      title: '显示文字信息',
      name: 'message',
      component: {
        type: 'markdown',
      },
    },
    {
      interface: 'radio',
      type: 'virtual',
      name: 'draft.returnType',
      title: '草稿提交成功后',
      dataSource: [
        { label: '显示文字信息', value: 'message' },
        { label: '跳转到页面', value: 'redirect' },
      ],
      component: {
        type: 'radio',
        'x-linkages': [
          {
            "type": "value:visible",
            "target": "draft.message",
            "condition": "{{ $self.value === 'message' }}"
          },
          {
            "type": "value:visible",
            "target": "draft.redirect",
            "condition": "{{ $self.value === 'redirect' }}"
          },
        ],
      },
    },
    {
      interface: 'linkTo',
      type: 'virtual',
      name: 'draft.redirect',
      target: 'menus',
      title: '跳转到页面',
      labelField: 'title',
      valueField: 'id',
      multiple: false,
      component: {
        type: 'drawerSelect',
        'x-component-props': {
          viewName: 'menus.table',
          resourceName: 'menus',
          labelField: 'title',
          valueField: 'id',
        },
      },
    },
    {
      interface: 'markdown',
      type: 'virtual',
      title: '显示文字信息',
      name: 'draft.message',
      component: {
        type: 'markdown',
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
          name: 'create',
          type: 'create',
          title: '新增',
          transform: {
            'data': 'view',
            'data.title': 'title',
          },
          viewName: 'views_v2.form',
        },
        {
          name: 'add',
          type: 'add',
          title: '选择',
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
          title: '移除',
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
        'width',
        'returnType',
        'redirect',
        'message',
        'draft.returnType',
        'draft.redirect',
        'draft.message',
      ],
    },
    {
      developerMode: true,
      type: 'descriptions',
      name: 'descriptions',
      title: '详情',
      actions: [
        {
          name: 'update',
          type: 'update',
          title: '编辑',
        },
      ],
      fields: [
        'view',
        'width',
        'returnType',
        'redirect',
        'message',
      ],
    },
  ],
} as TableOptions;
