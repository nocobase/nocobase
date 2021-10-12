import { TableOptions } from '@nocobase/database';

export default {
  name: 'users',
  title: '用户',
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
        title: '昵称',
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
        title: '邮箱',
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
        title: '密码',
        'x-component': 'Password',
      },
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
