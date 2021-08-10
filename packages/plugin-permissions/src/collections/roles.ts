import { TableOptions } from '@nocobase/database';

export default {
  name: 'roles',
  sortable: 'sort',
  fields: [
    {
      type: 'uid',
      name: 'name',
      primaryKey: true,
      prefix: 't_',
    },
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'belongsToMany',
      name: 'users',
      target: 'users',
      through: 'roles_users'
    },
  ],
} as TableOptions;
