import { TableOptions } from '@nocobase/database';

export default {
  name: 'fields_permissions',
  title: '列操作权限',
  developerMode: true,
  internal: true,
  fields: [
    {
      type: 'belongsTo',
      name: 'permission',
    },
    {
      type: 'belongsTo',
      name: 'field',
      onDelete: 'CASCADE',
    },
    {
      type: 'jsonb',
      name: 'actions'
    }
  ],
} as TableOptions;
