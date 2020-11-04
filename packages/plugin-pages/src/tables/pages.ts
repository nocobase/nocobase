import { TableOptions } from '@nocobase/database';

export default {
  name: 'pages',
  title: '页面配置',
  fields: [
    {
      type: 'integer',
      name: 'parent_id',
      component: {
        type: 'number',
        label: '父级页面',
      },
    },
    {
      type: 'string',
      name: 'title',
      showInTable: true,
      isMainTitle: true,
      component: {
        type: 'string',
        label: '名称',
      },
    },
    {
      type: 'string',
      name: 'path',
      unique: true,
      showInTable: true,
      component: {
        type: 'string',
        label: '路径',
      },
    },
    {
      type: 'string',
      name: 'icon',
      component: {
        type: 'string',
        label: '图标',
      },
    },
    {
      type: 'string',
      name: 'type',
      showInTable: true,
      component: {
        type: 'string',
        label: '类型',
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
      component: {
        type: 'string',
        label: '属于哪种数据集？',
      },
    },
    {
      type: 'string',
      name: 'template',
      showInTable: true,
      component: {
        type: 'string',
        label: '模板',
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
      // showInTable: true,
      defaultValue: false,
      component: {
        type: 'boolean',
        label: '在菜单里显示',
      },
    },
    {
      type: 'boolean',
      name: 'inherit',
      defaultValue: true,
      component: {
        type: 'boolean',
        label: '继承父级页面内容',
      },
    },
    {
      type: 'integer',
      name: 'order',
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
    },
    {
      type: 'update',
      name: 'update',
      title: '编辑',
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
      template: 'Form',
    },
    {
      type: 'details',
      name: 'details',
      title: '详情',
      template: 'Details',
    },
    {
      type: 'simple',
      name: 'simple',
      title: '简易模式',
      template: 'SimpleTable',
    },
    {
      type: 'table',
      name: 'table',
      title: '列表',
      template: 'Table',
    },
  ],
} as TableOptions;
