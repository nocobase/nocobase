import { TableOptions } from "@nocobase/database";

export default {
  name: 'posts',
  // 目前默认就带了
  // createdBy: true,
  statusable: false,
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'string',
      name: 'status',
      // TODO(BUG): 默认值无效
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
