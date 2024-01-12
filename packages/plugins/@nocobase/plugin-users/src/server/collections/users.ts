import { defineCollection } from '@nocobase/database';

export default defineCollection({
  origin: '@nocobase/plugin-users',
  dumpRules: {
    group: 'user',
  },
  name: 'users',
  title: '{{t("Users")}}',
  sortable: 'sort',
  model: 'UserModel',
  createdBy: true,
  updatedBy: true,
  logging: true,
  shared: true,
  fields: [
    {
      name: 'id',
      type: 'bigInt',
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      uiSchema: { type: 'number', title: '{{t("ID")}}', 'x-component': 'InputNumber', 'x-read-pretty': true },
      interface: 'id',
    },
    {
      interface: 'input',
      type: 'string',
      name: 'nickname',
      uiSchema: {
        type: 'string',
        title: '{{t("Nickname")}}',
        'x-component': 'Input',
      },
    },
    {
      interface: 'input',
      type: 'string',
      name: 'username',
      unique: true,
      uiSchema: {
        type: 'string',
        title: '{{t("Username")}}',
        'x-component': 'Input',
        'x-validator': { username: true },
        required: true,
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
        'x-validator': 'email',
        required: true,
      },
    },
    {
      interface: 'phone',
      type: 'string',
      name: 'phone',
      unique: true,
      uiSchema: {
        type: 'string',
        title: '{{t("Phone")}}',
        'x-component': 'Input',
        'x-validator': 'phone',
        required: true,
      },
    },
    {
      interface: 'password',
      type: 'password',
      name: 'password',
      hidden: true,
      uiSchema: {
        type: 'string',
        title: '{{t("Password")}}',
        'x-component': 'Password',
      },
    },
    {
      type: 'string',
      name: 'appLang',
    },
    {
      type: 'string',
      name: 'resetToken',
      unique: true,
      hidden: true,
    },
    {
      type: 'json',
      name: 'systemSettings',
      defaultValue: {},
    },
  ],
});
