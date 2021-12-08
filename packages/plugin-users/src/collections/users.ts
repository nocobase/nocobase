import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'users',
  title: '{{t("Users")}}',
  sortable: 'sort',
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
      otherKey: 'role_name',
      sourceKey: 'id',
      targetKey: 'name',
      uiSchema: {
        type: 'array',
        title: '{{t("Roles")}}',
        'x-component': 'Select.Drawer',
        'x-component-props': {
          multiple: true,
          fieldNames: {
            label: 'title',
            value: 'name',
          },
        },
        'x-decorator': 'FormItem',
        'x-designable-bar': 'Select.Drawer.DesignableBar',
      },
    },
    {
      interface: 'select',
      type: 'string',
      name: 'appLang',
    },
    {
      type: 'string',
      name: 'token',
      unique: true,
      hidden: true,
    },
    {
      type: 'string',
      name: 'resetToken',
      unique: true,
      hidden: true,
    },
  ],
} as CollectionOptions;
