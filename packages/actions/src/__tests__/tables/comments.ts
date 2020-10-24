import { TableOptions } from "@nocobase/database";

export default {
  name: 'comments',
  tableName: 'actions__comments',
  fields: [
    {
      type: 'string',
      name: 'content',
    },
    {
      type: 'string',
      name: 'status',
    },
    {
      type: 'belongsTo',
      name: 'post',
    },
    {
      type: 'belongsTo',
      name: 'user',
    }
  ],
  scopes: {
    published: {
      where: {
        status: 'published'
      }
    }
  },
} as TableOptions;
