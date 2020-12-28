import { TableOptions } from "@nocobase/database";

export default {
  name: 'profiles',
  tableName: 'actions__profiles',
  fields: [
    {
      type: 'belongsTo',
      name: 'user'
    },
    {
      type: 'string',
      name: 'email',
    },
    {
      type: 'string',
      name: 'city',
      dataSource: [
        { value: '1101', title: 'Beijing' },
        { value: '3710', title: 'Weihai' },
        { value: '5301', title: 'Kunming' }
      ]
    },
    {
      type: 'jsonb',
      name: 'interest',
      defaultValue: [],
      multiple: true,
      dataSource: [
        { value: 1, title: 'running' },
        { value: 2, title: 'climbing' },
        { value: 3, title: 'fishing' },
      ]
    }
  ],
} as TableOptions;
