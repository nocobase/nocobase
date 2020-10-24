import { TableOptions } from "@nocobase/database";

export default {
  name: 'tags',
  tableName: 'actions__tags',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'string',
      name: 'status',
    },
    {
      type: 'belongsToMany',
      name: 'posts',
    },
  ],
  scopes: {
    published: {
      where: {
        status: 'published'
      }
    }
  }
} as TableOptions;
