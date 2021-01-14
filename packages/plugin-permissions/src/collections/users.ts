import { TableOptions } from '@nocobase/database';

export default {
  name: 'users',
  fields: [
    {
      interface: 'linkTo',
      type: 'belongsToMany',
      name: 'roles',
      title: '权限组',
      target: 'roles',
      labelField: 'title',
      through: 'users_roles',
      component: {
        type: 'drawerSelect',
        // showInTable: true,
        showInForm: true,
        showInDetail: true,
        'x-component-props': {
          resourceName: 'collections.roles',
          labelField: 'title',
          valueField: 'id',
        },
      },
    },
  ],
};
