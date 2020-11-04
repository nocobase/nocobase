import { TableOptions } from '@nocobase/database';

export default {
  name: 'roles',
  title: '权限配置',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'json',
      name: 'options',
    },
  ],
} as TableOptions;
