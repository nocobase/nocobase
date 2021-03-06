import { TableOptions } from '@nocobase/database';

export default {
  name: 'automations_jobs',
  model: 'AutomationJobModel',
  title: '任务',
  internal: true,
  developerMode: true,
  fields: [
    {
      interface: 'linkTo',
      name: 'automation',
      type: 'belongsTo',
      component: {
        type: 'hidden',
        showInForm: true,
      },
    },
    {
      interface: 'string',
      type: 'string',
      name: 'title',
      title: '任务名称',
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'select',
      type: 'string',
      name: 'type',
      title: '任务类型',
      dataSource: [
        { label: '新增数据', value: 'create' },
        { label: '更新数据', value: 'update' },
        { label: '删除数据', value: 'destroy' },
        { label: '发送通知', value: 'message', disabled: true },
      ],
      component: {
        showInTable: true,
        showInDetail: true,
        showInForm: true,
        "x-linkages": [
          {
            "type": "value:visible",
            "target": "filter",
            "condition": "{{ ['update', 'destroy'].indexOf($self.value) !== -1 }}"
          },
          {
            "type": "value:visible",
            "target": "values",
            "condition": "{{ ['create', 'update'].indexOf($self.value) !== -1 }}"
          },
        ],
      },
    },
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'collection',
      target: 'collections',
      targetKey: 'name',
      title: '操作数据表',
      labelField: 'title',
      valueField: 'name',
      required: true,
      multiple: false,
      component: {
        type: 'remoteSelect',
        showInDetail: true,
        showInForm: true,
        'x-component-props': {
          resourceName: 'collections',
          labelField: 'title',
          valueField: 'name',
        },
        "x-linkages": [
          {
            type: "value:schema",
            target: "filter",
            // condition: "{{ $self.value }}",
            schema: {
              "x-component-props": {
                "associatedKey": "{{ typeof $self.value === 'string' ? $self.value : $form.values.collection_name }}",
                "sourceName": "{{ $form.values.automation ? $form.values.automation.collection_name : null }}"
              },
            },
          },
          {
            type: "value:schema",
            target: "values",
            // condition: "{{ $self.value }}",
            schema: {
              "x-component-props": {
                "associatedKey": "{{ typeof $self.value === 'string' ? $self.value : $form.values.collection_name }}",
                "sourceName": "{{ $form.values.automation ? $form.values.automation.collection_name : null }}"
              },
            },
          },
        ],
      },
    },
    {
      interface: 'json',
      type: 'json',
      name: 'filter',
      title: '满足以下条件的数据才会被操作',
      component: {
        type: 'filter',
        showInDetail: true,
        showInForm: true,
      },
    },
    {
      interface: 'json',
      type: 'json',
      name: 'values',
      title: '数据操作',
      component: {
        type: 'values',
        showInForm: true,
      },
    },
  ],
  views: [
    {
      type: 'form',
      name: 'form',
      title: '表单',
      template: 'DrawerForm',
      developerMode: true,
    },
    {
      type: 'details',
      name: 'details',
      title: '详情',
      template: 'Details',
      actionNames: ['update'],
      developerMode: true,
    },
    {
      type: 'table',
      name: 'table',
      title: '全部数据',
      template: 'Table',
      mode: 'simple',
      actionNames: ['destroy', 'create'],
      default: true,
      draggable: true,
    },
  ],
  tabs: [
    {
      type: 'details',
      name: 'details',
      title: '详情',
      viewName: 'details',
      default: true,
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
      fields: ['title', 'type'],
      detailsOpenMode: 'drawer', // window
      details: ['form'],
      sort: ['id'],
    },
    {
      type: 'descriptions',
      name: 'descriptions',
      title: '详情',
      fields: ['title', 'type'],
      actions: [
        {
          name: 'update',
          type: 'update',
          title: '编辑',
          viewName: 'form',
        },
      ],
    },
    {
      type: 'form',
      name: 'form',
      title: '表单',
      fields: [
        'title',
        'type',
        'collection',
        'filter',
        'values',
      ],
    },
  ],
  pages_v2: [
    {
      title: '表单',
      name: 'form',
      views: ['form'],
    },
  ],
} as TableOptions;
