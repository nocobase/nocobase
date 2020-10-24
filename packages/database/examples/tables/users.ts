import { TableOptions } from '../../src';

export default {
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'username',
      unique: true,
    },
    {
      type: 'string',
      name: 'password',
      // index: true,
    },
    {
      type: 'string',
      name: 'openid',
      index: true,
    },
    {
      type: 'hasOne',
      name: 'profile',
    },
    {
      type: 'hasMany',
      name: 'posts',
    },
    {
      type: 'hasMany',
      name: 'comments',
    }
  ],
} as TableOptions;