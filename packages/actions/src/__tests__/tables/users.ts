import { TableOptions } from "@nocobase/database";

export default {
  name: 'users',
  tableName: 'actions__users',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'hasone',
      name: 'profile',
    },
    {
      type: 'hasMany',
      name: 'posts'
    }
  ],
} as TableOptions;
