import { TableOptions } from '@nocobase/database';

export default {
  name: 'permissions',
  title: '权限集',
  developerMode: true,
  internal: true,
  fields: [
    // TODO(feature): 黑白名单控制
    // {
    //   comment: '白名单或黑名单',
    //   type: 'boolean',
    //   name: 'mode',
    //   defaultValue: false
    // },
    {
      type: 'integer',
      name: 'id',
      primaryKey: true,
      autoIncrement: true
    },
    {
      type: 'string',
      name: 'description',
    },
    {
      comment: '关联的角色',
      type: 'belongsTo',
      name: 'role',
    },
    {
      comment: '关联的表名',
      type: 'belongsTo',
      name: 'collection',
      targetKey: 'name'
    },
    {
      comment: '允许的操作集',
      type: 'hasMany',
      name: 'actions',
      target: 'actions_permissions'
    },
    {
      type: 'belongsToMany',
      name: 'fields',
      through: 'fields_permissions',
    },
    {
      type: 'hasMany',
      name: 'fields_permissions'
    },
    // {
    //   comment: '允许的 views 列表',
    //   type: 'belongsToMany',
    //   name: 'views',
    //   through: 'views_permissions'
    // },
    // {
    //   comment: '视图集（方便访问）',
    //   type: 'hasMany',
    //   name: 'views_permissions',
    // },
    {
      comment: '允许的 tabs 列表',
      type: 'belongsToMany',
      name: 'tabs',
      through: 'tabs_permissions'
    },
    {
      comment: '标签页集（方便访问）',
      type: 'hasMany',
      name: 'tabs_permissions',
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
  ],
} as TableOptions;
