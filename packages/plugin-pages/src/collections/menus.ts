import { TableOptions } from '@nocobase/database';

export default {
  name: 'menus',
  title: '菜单配置',
  // internal: true,
  // model: 'CollectionModel',
  developerMode: false,
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
      title: '菜单名称',
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
        { value: 'group', label: '菜单组' },
        { value: 'link', label: '自定义链接' },
        { value: 'page', label: '页面' },
      ],
      component: {
        'x-linkages': [
          {
            "type": "value:visible",
            "target": "pageName",
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
      name: 'pageName',
      title: '页面',
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
      fields: ['sort', 'icon', 'title', 'type'],
      detailsOpenMode: 'drawer', // window
      details: ['form'],
      sort: ['sort'],
    },
    {
      type: 'form',
      name: 'form',
      title: '表单',
      fields: ['type', 'parent', 'title', 'icon', 'url', 'pageName'],
    },
  ],
  pages_v2: [
    {
      title: '菜单配置',
      name: 'all',
      views: ['table'],
    },
    {
      title: '菜单表单',
      name: 'form',
      views: ['form'],
    },
  ],
} as TableOptions;
