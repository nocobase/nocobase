import { TableOptions } from '@nocobase/database';

export default {
  name: 'collections',
  title: '数据表配置',
  internal: true,
  sortable: true,
  draggable: true,
  model: 'CollectionModel',
  developerMode: true,
  createdAt: 'createdTime',
  updatedAt: 'updatedTime',
  fields: [
    {
      interface: 'sort',
      type: 'sort',
      name: 'sort',
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
      title: '数据表名称',
      required: true,
      component: {
        type: 'string',
        className: 'drag-visible',
        showInTable: true,
        showInForm: true,
        showInDetail: true,
      },
    },
    {
      interface: 'string',
      type: 'string',
      name: 'name',
      createOnly: true,
      title: '标识',
      unique: true,
      required: true,
      developerMode: true,
      component: {
        type: 'string',
        showInTable: true,
        showInForm: true,
        showInDetail: true,
      },
    },
    {
      interface: 'icon',
      type: 'virtual',
      name: 'icon',
      title: '图标',
      component: {
        type: 'icon',
        showInTable: true,
        showInForm: true,
        showInDetail: true,
      },
    },
    // {
    //   interface: 'radio',
    //   type: 'virtual',
    //   name: 'defaultView',
    //   title: '默认视图',
    //   defaultValue: 'table',
    //   dataSource: [
    //     {label: '表格', value: 'table'},
    //     {label: '看板', value: 'kanban', disabled: true},
    //     {label: '日历', value: 'calendar', disabled: true},
    //   ],
    //   component: {
    //     type: 'radio',
    //     showInTable: true,
    //     showInForm: true,
    //     showInDetail: true,
    //   },
    // },
    // {
    //   interface: 'radio',
    //   type: 'virtual',
    //   name: 'mode',
    //   title: '表格模式',
    //   defaultValue: 'default',
    //   dataSource: [
    //     {label: '常规模式', value: 'default'},
    //     {label: '简易模式', value: 'simple'},
    //   ],
    //   component: {
    //     type: 'radio',
    //     tooltip: `
    //       <p>常规模式：点击数据进入详情页进行各项查看和操作；<br/>简易模式：点击数据直接打开编辑表单</p>
    //     `,
    //     showInForm: true,
    //     showInDetail: true,
    //   },
    // },
    // {
    //   interface: 'radio',
    //   type: 'virtual',
    //   name: 'defaultPerPage',
    //   title: '每页显示几行数据',
    //   defaultValue: 50,
    //   dataSource: [
    //     {label: '20', value: 20},
    //     {label: '50', value: 50},
    //     {label: '100', value: 100},
    //   ],
    //   component: {
    //     type: 'radio',
    //     showInForm: true,
    //     showInDetail: true,
    //   },
    // },
    // {
    //   interface: 'boolean',
    //   type: 'virtual',
    //   name: 'draggable',
    //   title: '支持拖拽数据排序',
    //   showInForm: true,
    //   showInDetail: true,
    //   component: {
    //     type: 'checkbox',
    //     showInForm: true,
    //     showInDetail: true,
    //   },
    // },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'showInDataMenu',
      title: '显示在“数据”菜单里',
      component: {
        type: 'checkbox',
        showInTable: true,
        showInForm: true,
        showInDetail: true,
      },
    },
    {
      interface: 'boolean',
      type: 'virtual',
      name: 'createdAt',
      title: '记录创建时间',
      developerMode: true,
      defaultValue: true,
      component: {
        type: 'checkbox',
        default: true,
        showInForm: true,
      },
    },
    {
      interface: 'boolean',
      type: 'virtual',
      name: 'updatedAt',
      title: '记录修改时间',
      developerMode: true,
      defaultValue: true,
      component: {
        type: 'checkbox',
        default: true,
        showInForm: true,
      },
    },
    {
      interface: 'boolean',
      type: 'virtual',
      name: 'createdBy',
      title: '记录创建人信息',
      developerMode: true,
      component: {
        type: 'checkbox',
        default: true,
        showInForm: true,
      },
    },
    {
      interface: 'boolean',
      type: 'virtual',
      name: 'updatedBy',
      title: '记录修改人信息',
      developerMode: true,
      component: {
        type: 'checkbox',
        default: true,
        showInForm: true,
      },
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'developerMode',
      title: '开发者模式',
      developerMode: true,
      defaultValue: false,
      component: {
        type: 'boolean',
      },
    },
    {
      interface: 'json',
      type: 'json',
      name: 'options',
      title: '配置信息',
      defaultValue: {},
      component: {
        type: 'hidden',
      },
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'internal',
      title: '系统内置',
      defaultValue: false,
      developerMode: true,
      component: {
        type: 'boolean',
      },
    },
    {
      interface: 'linkTo',
      type: 'hasMany',
      name: 'fields',
      title: '字段',
      sourceKey: 'name',
      draggable: true,
      actions: {
        list: {
          sort: 'sort',
        },
        get: {
          fields: {
            appends: ['children'],
          },
        },
      },
      component: {
        type: 'drawerSelect',
      },
    },
    {
      interface: 'linkTo',
      type: 'hasMany',
      name: 'actions',
      title: '动作',
      sourceKey: 'name',
      draggable: true,
      actions: {
        list: {
          sort: 'sort',
        },
      },
      component: {
        type: 'drawerSelect',
      },
    },
    {
      interface: 'linkTo',
      type: 'hasMany',
      name: 'tabs',
      title: '标签页',
      sourceKey: 'name',
      draggable: true,
      actions: {
        list: {
          sort: 'sort',
        },
        destroy: {
          filter: {
            default: false
          }
        }
      },
      component: {
        type: 'drawerSelect',
      },
    },
    {
      interface: 'linkTo',
      type: 'hasMany',
      name: 'views',
      title: '视图',
      sourceKey: 'name',
      draggable: true,
      actions: {
        list: {
          sort: 'sort',
        },
        destroy: {
          filter: {
            default: false
          }
        }
      },
      component: {
        type: 'drawerSelect',
      },
    },
    {
      interface: 'linkTo',
      type: 'hasMany',
      name: 'views_v2',
      target: 'views_v2',
      title: '视图',
      sourceKey: 'name',
      draggable: true,
      // actions: {
      //   list: {
      //     sort: 'sort',
      //   },
      //   destroy: {
      //     filter: {
      //       default: false
      //     }
      //   }
      // },
      component: {
        type: 'drawerSelect',
      },
    },
    {
      interface: 'linkTo',
      type: 'hasMany',
      name: 'pages_v2',
      target: 'pages_v2',
      title: '页面',
      sourceKey: 'name',
      draggable: true,
      // actions: {
      //   list: {
      //     sort: 'sort',
      //   },
      //   destroy: {
      //     filter: {
      //       default: false
      //     }
      //   }
      // },
      component: {
        type: 'drawerSelect',
      },
    },
    {
      interface: 'linkTo',
      type: 'hasMany',
      name: 'scopes',
      target: 'scopes',
      title: '数据范围',
      sourceKey: 'name',
      actions: {
        list: {
          sort: 'id',
        },
        update: {
          filter: {
            locked: false
          }
        },
        destroy: {
          filter: {
            locked: false
          }
        }
      },
      component: {
        type: 'drawerSelect',
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
      type: 'destroy',
      name: 'destroy',
      title: '删除',
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
      name: 'permissionTable',
      title: '权限设置表格',
      mode: 'simple',
      template: 'SimpleTable',
      // actionNames: ['create', 'destroy'],
      detailsViewName: 'details',
      updateViewName: 'permissionForm',
    },
    {
      type: 'form',
      name: 'permissionForm',
      title: '权限设置表单',
      mode: 'simple',
      template: 'DrawerForm',
    },
    {
      type: 'table',
      name: 'table',
      title: '全部数据',
      template: 'Table',
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
    {
      type: 'association',
      name: 'fields',
      title: '字段',
      association: 'fields',
      viewName: 'simple',
    },
    {
      type: 'association',
      name: 'views',
      title: '视图',
      association: 'views',
      viewName: 'simple',
    },
    {
      type: 'association',
      name: 'actions',
      title: '动作',
      association: 'actions',
      viewName: 'simple',
      developerMode: true,
    },
    {
      type: 'association',
      name: 'tabs',
      title: '标签页',
      association: 'tabs',
      viewName: 'simple',
    },
    // {
    //   type: 'association',
    //   name: 'roles',
    //   title: '权限',
    //   association: 'roles',
    //   viewName: 'simple2',
    // },
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
      fields: ['sort', 'title'],
      openMode: 'drawer', // window
      pages: ['details', 'fields', 'views', 'pages'],
      sort: ['sort'],
    },
    {
      type: 'form',
      name: 'form',
      title: '表单',
      fields: ['title'],
    },
    {
      type: 'details',
      name: 'details',
      title: '详情',
      fields: ['title'],
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
      type: 'association',
      name: 'fields',
      title: '字段',
      targetViewName: 'table',
      targetFieldName: 'fields',
    },
    {
      type: 'association',
      name: 'views',
      title: '视图',
      targetViewName: 'table',
      targetFieldName: 'views_v2',
    },
    {
      type: 'association',
      name: 'pages',
      title: '页面',
      targetViewName: 'table',
      targetFieldName: 'pages_v2',
    },
  ],
  pages_v2: [
    {
      title: '数据表配置',
      name: 'all',
      views: ['table'],
    },
    {
      title: '详情',
      name: 'details',
      views: ['details'],
    },
    {
      title: '字段',
      name: 'fields',
      views: ['fields'],
    },
    {
      title: '视图',
      name: 'views',
      views: ['views'],
    },
    {
      title: '页面',
      name: 'pages',
      views: ['pages'],
    },
  ],
} as TableOptions;
