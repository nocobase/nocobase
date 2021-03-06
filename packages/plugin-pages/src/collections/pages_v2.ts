import { TableOptions } from '@nocobase/database';

export default {
  name: 'pages_v2',
  title: '页面配置',
  // internal: true,
  model: 'BaseModel',
  developerMode: false,
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
      component: {
        type: 'virtualTable',
      },
    },
    {
      interface: 'json',
      type: 'json',
      name: 'options',
      title: '配置信息',
      defaultValue: {},
      developerMode: true,
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
      type: 'form',
      name: 'form',
      title: '表单',
      fields: ['title', 'views'],
    },
    {
      type: 'form',
      name:  'global_form',
      fields: ['title', 'views'],
    },
  ],
  pages_v2: [
    {
      title: '表格',
      name: 'collections',
      views: ['collection_pages'],
    },
    {
      title: '独立页面',
      name: 'globals',
      views: ['global_pages'],
    },
    {
      title: '表单',
      name: 'form',
      views: ['form'],
    },
  ],
} as TableOptions;
