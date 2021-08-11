import { TableOptions } from '@nocobase/database';

export default {
  name: 'roles',
  sortable: 'sort',
  fields: [
    {
      type: 'uid',
      name: 'name',
      primaryKey: true,
      prefix: 'r_',
    },
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'hasMany',
      name: 'actionPermissions',
      target: 'action_permissions',
    },
    {
      type: 'belongsToMany',
      name: 'users',
      target: 'users',
      through: 'roles_users'
    },
    {
      type: 'belongsToMany',
      name: 'ui_schemas',
      target: 'ui_schemas',
      through: 'roles_ui_schemas'
    },
  ],
} as TableOptions;
