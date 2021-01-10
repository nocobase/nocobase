import { TableOptions } from "@nocobase/database";

export default {
  name: 'posts',
  // 目前默认就带了
  // createdBy: true,
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
      name: 'category',
    },
    {
      type: 'hasMany',
      name: 'comments',
    },
  ]
} as TableOptions;
