import { TableOptions } from '@nocobase/database';

export default {
  name: 'pages',
  title: '页面配置',
  fields: [
    {
      type: 'integer',
      name: 'sort',
      title: '排序',
      component: {
        type: 'sort',
        className: 'drag-visible',
        width: 60,
      },
    },
    {
      type: 'string',
      name: 'title',
      title: '名称',
      showInTable: true,
      isMainTitle: true,
      component: {
        type: 'string',
        className: 'drag-visible',
      },
    },
    {
      type: 'integer',
      name: 'parent_id',
      title: '父级页面',
      component: {
        type: 'number',
      },
    },
    {
      type: 'string',
      name: 'path',
      title: '路径',
      unique: true,
      showInTable: true,
      component: {
        type: 'string',
      },
    },
    {
      type: 'string',
      name: 'icon',
      title: '图标',
      component: {
        type: 'string',
      },
    },
    {
      type: 'string',
      name: 'type',
      title: '类型',
      showInTable: true,
      component: {
        type: 'string',
        enum: [
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
      type: 'string',
      name: 'collection',
      title: '属于哪种数据集？',
      component: {
        type: 'string',
      },
    },
    {
      type: 'string',
      name: 'template',
      title: '模板',
      showInTable: true,
      component: {
        type: 'string',
        enum: [
          {
            label: '顶部菜单布局',
            value: 'LayoutWithTopMenu',
          },
          {
            label: '左侧菜单布局',
            value: 'LayoutWithSideMenu',
          },
          {
            label: '数据集（全部）',
            value: 'collections',
          },
          {
            label: '数据集（某种）',
            value: 'collection',
          },
          {
            label: '登录',
            value: 'login',
          },
          {
            label: '注册',
            value: 'register',
          },
          {
            label: '分析页',
            value: 'analysis',
          },
          {
            label: '工作区',
            value: 'workplace',
          },
        ],
      },
    },
    {
      type: 'boolean',
      name: 'showInMenu',
      title: '在菜单里显示',
      // showInTable: true,
      defaultValue: false,
      component: {
        type: 'boolean',
      },
    },
    {
      type: 'boolean',
      name: 'inherit',
      title: '继承父级页面内容',
      defaultValue: true,
      component: {
        type: 'boolean',
      },
    },
    {
      type: 'hasMany',
      name: 'children',
      target: 'pages',
      foreignKey: 'parent_id',
      sourceKey: 'id',
    },
    {
      type: 'json',
      name: 'options',
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
      title: '创建',
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
