import { TableOptions } from '@nocobase/database';

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
      interface: 'boolean',
      comment: '支持匿名用户',
      type: 'boolean',
      name: 'anonymous',
      defaultValue: false
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
      name: 'pages',
    },
    {
      comment: '权限集（方便访问）',
      type: 'hasMany',
      name: 'permissions'
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
      name: 'pages',
      title: '页面权限',
      association: 'pages',
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
} as TableOptions;
