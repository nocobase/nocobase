import { extend } from '@nocobase/database';

export default extend({
  name: 'roles',
  fields: [
    {
      interface: 'linkTo',
      type: 'belongsToMany',
      name: 'pages',
      title: '可访问的页面',
      through: 'routes_permissions',
      foreignKey: 'role_id',
      otherKey: 'routable_id',
      morphType: 'routable', // 现在没有多态关联的设置，暂时先这么写了
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
}, {
  customMerge(key) {
    if (['tabs'].includes(key)) {
      return (x = [], y = []) => {
        const last = x.pop();
        const tabs = x.concat(y);
        tabs.push(last);
        return tabs;
      };
    }
  }
});
