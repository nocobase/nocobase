import { TableOptions } from '@nocobase/database';

export default {
  name: 'roles',
  sortable: 'sort',
  title: '{{t("Roles")}}',
  fields: [
    {
      type: 'uid',
      name: 'name',
      // unique: true,
      primaryKey: true,
      prefix: 'r_',
      state: 0,
    },
    {
      interface: 'string',
      type: 'string',
      name: 'title',
      uiSchema: {
        type: 'string',
        title: '{{t("Role name")}}',
        'x-component': 'Input',
      },
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
      through: 'roles_users',
    },
    {
      type: 'belongsToMany',
      name: 'ui_schemas',
      target: 'ui_schemas',
      through: 'roles_ui_schemas',
    },
  ],
} as TableOptions;
