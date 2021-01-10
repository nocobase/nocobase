import { TableOptions } from '@nocobase/database';

export default {
  name: 'fields_permissions',
  title: '列操作权限',
  fields: [
    {
      type: 'belongsTo',
      name: 'action',
      target: 'actions_permissions',
    },
    {
      type: 'belongsTo',
      name: 'field'
    },
  ],
} as TableOptions;
