import { CollectionOptions } from '@nocobase/database';

export default {
  namespace: 'users.users',
  duplicator: {
    dumpable: 'optional',
    with: 'rolesUsers',
  },
  name: 'users',
  title: '{{t("Users")}}',
  sortable: 'sort',
  model: 'UserModel',
  createdBy: true,
  updatedBy: true,
  logging: true,
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
      interface: 'sequence',
      type: 'sequence',
      name: 'account',
      uiSchema: {
        type: 'string',
        title: '{{t("Account")}}',
        'x-component': 'Input',
      },
      inputable:true,
      patterns: [
        {
          type: "date",
          options: {}
        },
        {
          type: "integer",
          options: {
            digits: 4,
            start: 0,
            cycle: "0 0 1 * *",
            key: 52
          }
        }
      ]
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
  ],
} as CollectionOptions;
