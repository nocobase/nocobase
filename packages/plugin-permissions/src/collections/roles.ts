import { TableOptions } from '@nocobase/database';

export default {
  name: 'roles',
  title: '角色',
  fields: [
    {
      comment: '角色名称',
      type: 'string',
      name: 'title',
    },
    {
      comment: '支持匿名用户',
      type: 'boolean',
      name: 'anonymous',
      defaultValue: false
    },
    // TODO(feature): 用户组后续考虑
    // TODO(feature): 用户表应通过插件配置关联，考虑到今后会有多账户系统的情况
    {
      comment: '关联的用户表',
      type: 'belongsToMany',
      name: 'users',
      through: 'users_roles',
      otherKey: { allowNull: true }
    },
    {
      comment: '包含的以数据表分组的权限集',
      type: 'belongsToMany',
      name: 'collections',
      through: 'permissions',
      targetKey: 'name'
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
      type: 'form',
      name: 'permission_form',
      title: '数据表配置',
      template: 'PermissionForm',
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
      actionNames: ['create', 'destroy'],
      detailsViewName: 'details',
      updateViewName: 'permission_form',
    },
    {
      type: 'simple',
      name: 'simple2',
      title: '简易模式',
      template: 'SimpleTable',
      detailsViewName: 'details',
      updateViewName: 'permission_form',
      paginated: false,
    },
    {
      type: 'table',
      name: 'table',
      title: '列表',
      template: 'Table',
      actionNames: ['create', 'destroy'],
      default: true,
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
      type: 'details',
      name: 'collections',
      title: '数据表权限',
      viewName: 'simple',
    },
  ],
} as TableOptions;
