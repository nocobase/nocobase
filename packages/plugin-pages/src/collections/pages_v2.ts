import { TableOptions } from '@nocobase/database';

export default {
  name: 'pages_v2',
  title: '页面配置',
  internal: true,
  model: 'BaseModel',
  developerMode: true,
  createdAt: false,
  updatedAt: false,
  fields: [
    {
      interface: 'string',
      type: 'string',
      name: 'title',
      title: '页面名称',
      required: true,
    },
    {
      interface: 'string',
      type: 'string',
      name: 'path',
      title: '路径',
      required: true,
      unique: true,
      createOnly: true,
      developerMode: true,
    },
    {
      interface: 'string',
      type: 'randomString',
      name: 'name',
      title: '缩略名',
      required: true,
      createOnly: true,
      randomString: {
        length: 6,
        characters: 'abcdefghijklmnopqrstuvwxyz0123456789',
      },
      developerMode: true,
    },
    {
      interface: 'radio',
      type: 'string',
      name: 'type',
      title: '类型',
      required: true,
      defaultValue: 'static',
      dataSource: [
        { value: 'static', label: '多条数据页面' },
        { value: 'dynamic', label: '单条数据子页面' },
      ],
    },
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'collection',
      target: 'collections',
      targetKey: 'name',
      title: '所属数据表',
      labelField: 'title',
      valueField: 'name',
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
      },
    },
    {
      interface: 'json',
      type: 'virtual',
      name: 'views',
      title: '显示在页面里的视图',
      target: 'pages_views_v2',
      component: {
        type: 'subTable',
        'x-linkages': [
          {
            type: 'value:schema',
            target: 'views',
            schema: {
              'x-component-props': {
                __parent: '{{ $form.values && $form.values.associatedKey }}',
                associatedKey: "{{ $form.values && $form.values.id }}"
              },
            },
          },
        ],
      },
    },
    // {
    //   interface: 'subTable',
    //   type: 'hasMany',
    //   name: 'pages_views',
    //   target:  'pages_views_v2',
    //   // sourceKey: 'path',
    //   title: '显示在页面里的视图(pages_views)',
    //   component: {
    //     type: 'subTable',
    //     'x-linkages': [
    //       {
    //         type: 'value:schema',
    //         target: 'pages_views',
    //         schema: {
    //           'x-component-props': {
    //             __parent: '{{ $form.values && $form.values.associatedKey }}',
    //             associatedKey: "{{ $form.values && $form.values.id }}"
    //           },
    //         },
    //       },
    //     ],
    //   },
    // },
    {
      interface: 'json',
      type: 'json',
      name: 'options',
      title: '配置信息',
      defaultValue: {},
      developerMode: true,
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'developerMode',
      title: '开发者模式',
      defaultValue: false,
      component: {
        type: 'boolean',
      },
    },
  ],
  actions: [
    {
      type: 'list',
      name: 'list',
      title: '查看',
    },
    {
      type: 'create',
      name: 'create',
      title: '新增',
      viewName: 'form',
    },
    {
      type: 'update',
      name: 'update',
      title: '编辑',
      viewName: 'form',
    },
    {
      type: 'destroy',
      name: 'destroy',
      title: '删除',
    },
  ],
  views_v2: [
    {
      developerMode: true,
      type: 'table',
      name: 'all_pages',
      title: '全部页面',
      rowKey: 'path',
      labelField: 'title',
      fields: ['title', 'collection'],
      detailsOpenMode: 'drawer', // window
      details: ['form'],
      sort: ['id'],
      filter: {
        type: 'static',
      },
      actions: [
        {
          name: 'filter',
          type: 'filter',
          title: '过滤',
          fields: [
            'title',
          ],
        }
      ],
    },
    {
      developerMode: true,
      type: 'table',
      name: 'collection_pages',
      title: '数据表页面',
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
      fields: ['title'],
      detailsOpenMode: 'drawer', // window
      details: ['form'],
      sort: ['id'],
    },
    {
      developerMode: true,
      type: 'table',
      name: 'global_pages',
      title: '独立页面',
      labelField: 'title',
      actions: [
        {
          name: 'create',
          type: 'create',
          title: '新增',
          viewName: 'global_form',
        },
        {
          name: 'destroy',
          type: 'destroy',
          title: '删除',
        },
      ],
      filter: {
        collection_name: null,
      },
      fields: ['title'],
      detailsOpenMode: 'drawer', // window
      details: ['global_form'],
      sort: ['id'],
    },
    {
      developerMode: true,
      type: 'table',
      name: 'permissions_table',
      title: '全部数据',
      labelField: 'title',
      actions: [],
      fields: ['title'],
      detailsOpenMode: 'drawer', // window
      details: ['form'],
      sort: ['id'],
    },
    {
      developerMode: true,
      type: 'form',
      name: 'form',
      title: '表单',
      fields: ['title', 'type', 'views', 'pages_views'],
    },
    {
      developerMode: true,
      type: 'form',
      name: 'global_form',
      title: '独立页面表单',
      fields: ['title', 'views', 'pages_views'],
    },
  ],
} as TableOptions;
