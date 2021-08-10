import { TableOptions } from "@nocobase/database";

export default {
  name: 'comments',
  fields: [
    {
      type: 'string',
      name: 'content',
    },
    {
      type: 'belongsTo',
      name: 'post',
    },
    {
      type: 'belongsTo',
      name: 'user',
    },
  ]
} as TableOptions;
