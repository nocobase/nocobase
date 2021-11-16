import { TableOptions } from '@nocobase/database';

export default {
  name: 'users',
  title: '{{t("Users")}}',
  sortable: 'sort',
  // developerMode: true,
  // internal: true,
  createdBy: false,
  updatedBy: false,
  privilege: 'undelete',
  scopes: {
    withPassword: {
      attributes: { include: ['password'] },
    },
  },
  defaultScope: {
    attributes: { exclude: ['password'] },
  },
  fields: [
    {
      interface: 'string',
      type: 'string',
      name: 'nickname',
      uiSchema: {
        type: 'string',
        title: '{{t("Nickname")}}',
        'x-component': 'Input',
      },
    },
    {
      interface: 'email',
      type: 'string',
      name: 'email',
      unique: true,
      privilege: 'undelete',
      uiSchema: {
        type: 'string',
        title: '{{t("Email")}}',
        'x-component': 'Input',
        require: true,
      },
    },
    {
      interface: 'password',
      type: 'password',
      name: 'password',
      privilege: 'undelete',
      uiSchema: {
        type: 'string',
        title: '{{t("Password")}}',
        'x-component': 'Password',
      },
    },
    {
      interface: 'linkTo',
      type: 'belongsToMany',
      name: 'roles',
      target: 'roles',
      foreignKey: 'user_id',
      otherKey: 'role_id',
      sourceKey: 'id',
      targetKey: 'id',
      uiSchema: {
        type: 'array',
        title: '{{t("Roles")}}',
        'x-component': 'Select.Drawer',
        'x-component-props': {},
        'x-decorator': 'FormItem',
        'x-designable-bar': 'Select.Drawer.DesignableBar',
      },
    },
    {
      interface: 'select',
      type: 'string',
      name: 'appLang',
      privilege: 'undelete',
      state: 0,
    },
    {
      interface: 'password',
      type: 'string',
      name: 'token',
      unique: true,
      hidden: true,
      privilege: 'undelete',
      state: 0,
    },
    {
      interface: 'password',
      type: 'string',
      name: 'reset_token',
      unique: true,
      hidden: true,
      privilege: 'undelete',
      state: 0,
    },
  ],
} as TableOptions;
