import { TableOptions } from "@nocobase/database";

export default {
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'string',
      name: 'status',
      defaultValue: 'draft',
    },
    {
      type: 'belongsTo',
      name: 'user',
    },
    {
      type: 'belongsTo',
      name: 'category',
    },
    {
      type: 'hasMany',
      name: 'comments',
    },
  ]
} as TableOptions;
