import { TableOptions } from '@nocobase/database';

export default {
  name: 'menus',
  title: '菜单和页面配置',
  internal: true,
  // model: 'CollectionModel',
  developerMode: true,
  createdAt: false,
  updatedAt: false,
  fields: [
    {
      interface: 'sort',
      type: 'sort',
      name: 'sort',
      scope: ['parent_id'],
      title: '排序',
      component: {
        type: 'sort',
        className: 'drag-visible',
        width: 60,
        showInTable: true,
      },
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
      interface: 'linkTo',
      multiple: false,
      type: 'belongsTo',
      name: 'parent',
      title: '父级菜单',
      target: 'menus',
      foreignKey: 'parent_id',
      targetKey: 'id',
      labelField: 'title',
      valueField: 'id',
      component: {
        type: 'drawerSelect',
        'x-component-props': {
          placeholder: '请选择菜单组',
          labelField: 'title',
          valueField: 'id',
          filter: {
            type: 'group',
          },
        },
      },
    },
    {
      interface: 'string',
      type: 'string',
      name: 'title',
      title: '菜单/页面名称',
      required: true,
    },
    {
      interface: 'icon',
      type: 'string',
      name: 'icon',
      title: '图标',
      component: {
        type: 'icon',
      },
    },
    {
      interface: 'radio',
      type: 'string',
      name: 'type',
      title: '菜单类型',
      required: true,
      dataSource: [
        { value: 'group', label: '菜单组', color: 'red' },
        { value: 'page', label: '页面', color: 'green' },
        { value: 'link', label: '自定义链接', color: 'orange' },
      ],
      component: {
        'x-linkages': [
          {
            "type": "value:visible",
            "target": "views",
            "condition": "{{ $self.value === 'page' }}"
          },
          {
            "type": "value:visible",
            "target": "url",
            "condition": "{{ $self.value === 'link' }}"
          },
        ],
      },
    },
    {
      interface: 'string',
      type: 'string',
      name: 'url',
      title: '链接地址',
      required: true,
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'developerMode',
      title: '开发者模式',
      developerMode: true,
      defaultValue: false,
    },
    {
      interface: 'json',
      type: 'json',
      name: 'views',
      title: '显示在页面里的视图',
      target: 'menus_views_v2',
      component: {
        type: 'subTable',
        'x-component-props': {
          viewName: 'menus.views',
        },
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
    //   name: 'menus_views',
    //   title: '显示在页面里的视图',
    //   target:  'menus_views_v2',
    //   sourceKey: 'id',
    //   foreignKey: 'menu_id',
    //   component: {
    //     type: 'subTable',
    //     'x-component-props': {
    //       viewName: 'menus.menus_views',
    //       filter: {
    //         or: [
    //           {
    //             'type.neq': 'descriptions',
    //           },
    //           {
    //             'data_source_type.neq': 'association',
    //           }
    //         ],
    //       },
    //     },
    //     'x-linkages': [
    //       {
    //         type: 'value:schema',
    //         target: 'menus_views',
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
      type: 'hasMany',
      name: 'children',
      target: 'menus',
      foreignKey: 'parent_id',
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
  views: [
    {
      type: 'form',
      name: 'form',
      title: '表单',
      template: 'DrawerForm',
    },
    {
      type: 'details',
      name: 'details',
      title: '详情',
      template: 'Details',
      actionNames: ['update'],
    },
    {
      type: 'table',
      name: 'simple',
      title: '简易模式',
      template: 'SimpleTable',
      default: true,
      mode: 'simple',
      actionNames: ['create', 'destroy'],
      detailsViewName: 'details',
      updateViewName: 'form',
      paginated: false,
    },
    {
      type: 'table',
      name: 'table',
      title: '列表',
      template: 'Table',
      actionNames: ['create', 'destroy'],
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
      expandable: {
        expandIconColumnIndex: 3,
      },
      paginated: false,
      fields: ['sort', 'title', 'icon', 'type'],
      detailsOpenMode: 'drawer', // window
      details: ['form'],
      sort: ['sort'],
    },
    {
      developerMode: true,
      type: 'form',
      name: 'form',
      title: '表单',
      fields: ['type', 'parent', 'title', 'icon', 'url', 'views'],
    },
    {
      developerMode: true,
      type: 'table',
      name: 'permissions_table',
      title: '权限表格',
      labelField: 'title',
      actions: [],
      expandable: {},
      fields: [
        'title',
        {
          interface: 'boolean',
          name: 'accessible',
          type: 'boolean',
          title: '允许访问',
          dataIndex: ['accessible'],
          editable: true,
          resourceName: 'roles.menus',
          component: {
            type: 'checkbox',
          },
        },
      ],
      // detailsOpenMode: 'drawer', // window
      details: [],
      sort: ['sort'],
    },
    {
      developerMode: true,
      type: 'form',
      name: 'permissions_form',
      title: '权限表单',
      fields: ['type', 'title'],
    },
  ],
} as TableOptions;
