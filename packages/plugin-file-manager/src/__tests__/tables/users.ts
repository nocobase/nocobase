import { TableOptions } from "@nocobase/database";

export default {
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'file',
      name: 'avatar',
      target: 'attachment'
    },
  ],
} as TableOptions;
