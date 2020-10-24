import { TableOptions } from "@nocobase/database";

export default {
  name: 'profiles',
  tableName: 'actions__profiles',
  fields: [
    {
      type: 'string',
      name: 'email',
    },
  ],
} as TableOptions;
