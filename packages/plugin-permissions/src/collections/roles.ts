import { TableOptions } from '@nocobase/database';
import { ROLE_TYPE_ROOT, ROLE_TYPE_USER, ROLE_TYPE_ANONYMOUS } from '../constants';

export default {
  name: 'roles',
  title: '权限组配置',
  developerMode: true,
  internal: true,
  fields: [
    {
      interface: 'string',
      title: '权限组名称',
      comment: '角色名称',
      type: 'string',
      name: 'title',
      component: {
        showInTable: true,
        showInForm: true,
        showInDetail: true,
      },
    },
    {
      interface: 'select',
      title: '角色类型',
      type: 'integer',
      name: 'type',
      developerMode: true,
      dataSource: [
        { value: ROLE_TYPE_ROOT, label: '系统角色' },
        { value: ROLE_TYPE_ANONYMOUS, label: '匿名角色' },
        { value: ROLE_TYPE_USER, label: '自定义角色' },
      ],
      defaultValue: ROLE_TYPE_USER,
      component: {
        showInTable: true,
        showInDetail: true,
      }
    },
    {
      interface: 'boolean',
      title: '默认角色',
      type: 'radio',
      name: 'default',
      component: {
        showInTable: true,
        showInForm: true,
        showInDetail: true,
      }
    },
    {
      interface: 'textarea',
      title: '描述',
      type: 'text',
      name: 'description',
      component: {
        showInTable: true,
        showInForm: true,
        showInDetail: true,
      },
    },
    // TODO(feature): 用户组后续考虑
    // TODO(feature): 用户表应通过插件配置关联，考虑到今后会有多账户系统的情况
    {
      interface: 'linkTo',
      title: '用户',
      comment: '关联的用户表',
      type: 'belongsToMany',
      name: 'users',
      target: 'users',
      through: 'users_roles'
    },
    {
      interface: 'linkTo',
      title: '数据表',
      comment: '包含的以数据表分组的权限集',
      type: 'belongsToMany',
      name: 'collections',
      through: 'permissions',
      targetKey: 'name'
    },
    {
      interface: 'linkTo',
      title: '页面',
      type: 'belongsToMany',
      name: 'pages_v2',
      target: 'pages_v2',
      through: 'pages_v2_permissions',
    },
    {
      comment: '权限集（方便访问）',
      type: 'hasMany',
      name: 'permissions'
    },
  ],
  actions: [
    {
      type: 'list',
      name: 'list',
      title: '查看',
    },
    // {
    //   type: 'get',
    //   name: 'get',
    //   title: '详情',
    // },
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
      filter: {
        type: ROLE_TYPE_USER,
        default: false
      }
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
      mode: 'simple',
      template: 'SimpleTable',
      actionNames: ['create', 'destroy'],
      detailsViewName: 'details',
      updateViewName: 'form',
    },
    {
      type: 'table',
      name: 'table',
      title: '列表',
      template: 'Table',
      actionNames: ['create', 'destroy'],
      default: true,
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
  ],
  tabs: [
    {
      type: 'details',
      name: 'details',
      title: '详情',
      viewName: 'details',
      default: true,
    },
    // {
    //   type: 'details',
    //   name: 'collections',
    //   title: '数据表权限',
    //   viewName: 'simple',
    // },
    {
      type: 'association',
      name: 'collections',
      title: '数据表权限',
      association: 'collections',
      viewName: 'permissionTable',
    },
    {
      type: 'association',
      name: 'users',
      title: '当前组用户',
      association: 'users',
      viewName: 'simple',
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
      fields: ['title'],
      openMode: 'drawer', // window
      pages: ['details', 'collections', 'pages'],
      sort: ['id'],
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
      type: 'form',
      name: 'form',
      title: '表单',
      fields: ['title'],
    },
    {
      type: 'association',
      name: 'collections',
      title: '数据表权限视图',
      targetViewName: 'permissions_table',
      targetFieldName: 'collections',
    },
    {
      type: 'association',
      name: 'pages',
      title: '页面权限视图',
      targetViewName: 'permissions_table',
      targetFieldName: 'pages_v2',
    },
  ],
  pages_v2: [
    {
      title: '全部',
      name: 'all',
      views: ['table'],
    },
    {
      title: '详情',
      name: 'details',
      views: ['details'],
    },
    {
      title: '表单',
      name: 'form',
      views: ['form'],
    },
    {
      title: '数据表权限',
      name: 'collections',
      views: ['collections'],
    },
    {
      title: '页面权限',
      name: 'pages',
      views: ['pages'],
    },
  ],
} as TableOptions;
