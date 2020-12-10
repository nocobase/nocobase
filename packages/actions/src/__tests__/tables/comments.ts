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
    },
    {
      type: 'sort',
      name: 'sort'
    },
    {
      type: 'sort',
      name: 'sort_in_status',
      scope: ['status']
    },
    {
      type: 'sort',
      name: 'sort_in_post',
      scope: ['post']
    }
  ],
  scopes: {
    published: {
      where: {
        status: 'published'
      }
    }
  }
} as TableOptions;
