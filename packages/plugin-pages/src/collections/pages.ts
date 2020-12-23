import { TableOptions } from '@nocobase/database';

export default {
  name: 'pages',
  title: '页面配置',
  model: 'PageModel',
  internal: true,
  developerMode: true,
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
      type: 'string',
      name: 'title',
      title: '名称',
      component: {
        type: 'string',
        className: 'drag-visible',
        showInTable: true,
        showInForm: true,
        showInDetail: true,
      },
    },
    {
      interface: 'number',
      type: 'integer',
      name: 'parent_id',
      title: '父级页面',
      component: {
        type: 'number',
        showInForm: true,
        showInDetail: true,
      },
    },
    {
      interface: 'string',
      type: 'string',
      name: 'path',
      title: '路径',
      unique: true,
      component: {
        type: 'string',
        showInTable: true,
        showInForm: true,
        showInDetail: true,
      },
    },
    {
      interface: 'icon',
      type: 'string',
      name: 'icon',
      title: '图标',
      component: {
        type: 'icon',
        showInTable: true,
        showInForm: true,
        showInDetail: true,
      },
    },
    {
      interface: 'select',
      type: 'string',
      name: 'type',
      title: '类型',
      options: [
        {
          label: '页面',
          value: 'page',
        },
        {
          label: '布局',
          value: 'layout',
        },
        {
          label: '数据集',
          value: 'collection',
        },
      ],
      component: {
        type: 'string',
        showInTable: true,
        showInForm: true,
        showInDetail: true,
        'x-linkages': [
          {
            "type": "value:visible",
            "target": "collection",
            "condition": "{{ ['collection'].indexOf($self.value) !== -1 }}"
          },
        ]
      },
    },
    {
      interface: 'select',
      type: 'string',
      name: 'collection',
      title: '属于哪种数据集？',
      component: {
        type: 'select',
        showInForm: true,
        showInDetail: true,
      },
    },
    {
      interface: 'select',
      type: 'string',
      name: 'template',
      title: '模板',
      options: [
        {
          label: '顶部菜单布局',
          value: 'TopMenuLayout',
        },
        {
          label: '左侧菜单布局',
          value: 'SideMenuLayout',
        },
      ],
      component: {
        type: 'select',
        showInTable: true,
        showInForm: true,
        showInDetail: true,
      },
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'showInMenu',
      title: '在菜单里显示',
      defaultValue: false,
      component: {
        type: 'checkbox',
        showInTable: true,
        showInForm: true,
        showInDetail: true,
      },
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'inherit',
      title: '继承父级页面内容',
      defaultValue: true,
      component: {
        type: 'checkbox',
        showInTable: true,
        showInForm: true,
        showInDetail: true,
      },
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
    {
      interface: 'linkTo',
      type: 'hasMany',
      name: 'children',
      title: '子页面',
      target: 'pages',
      foreignKey: 'parent_id',
      sourceKey: 'id',
      component: {
        type: 'drawerSelect',
      },
    },
    {
      interface: 'number',
      type: 'integer',
      name: 'viewId',
      title: '视图ID',
      component: {
        type: 'number',
      },
    },
    {
      interface: 'json',
      type: 'json',
      name: 'options',
      title: '元数据',
      component: {
        type: 'hidden',
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
      type: 'simple',
      name: 'simple',
      title: '简易模式',
      template: 'SimpleTable',
      default: true,
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
} as TableOptions;
