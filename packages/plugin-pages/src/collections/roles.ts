import { extend } from '@nocobase/database';

export default extend({
  name: 'roles',
  fields: [
    {
      interface: 'linkTo',
      type: 'hasMany',
      name: 'routes_permissions',
      title: '可访问的页面',
    }
  ],
  tabs: [
    {
      type: 'association',
      name: 'pages',
      title: '系统菜单权限',
      association: 'pages',
      viewName: 'permissionTable',
    },
  ]
});
