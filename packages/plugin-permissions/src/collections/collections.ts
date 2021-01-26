import { extend } from '@nocobase/database';

export default extend({
  name: 'collections',
  fields: [
    {
      interface: 'linkTo',
      type: 'hasMany',
      name: 'scopes',
      target: 'actions_scopes',
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
    {
      interface: 'linkTo',
      title: '权限',
      type: 'belongsToMany',
      name: 'roles',
      through: 'permissions',
      sourceKey: 'name'
    },
    // {
    //   type: 'hasMany',
    //   name: 'permissions',
    //   sourceKey: 'name',
    //   foreignKey: 'collection_name'
    // }
  ],
  views: [
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
      type: 'association',
      name: 'permissions',
      title: '权限',
      association: 'roles',
      viewName: 'permissionTable',
    },
  ],
}, {
  customMerge(key) {
    if (['views', 'tabs'].includes(key)) {
      return (x = [], y = []) => x.concat(y);
    }
  }
});
