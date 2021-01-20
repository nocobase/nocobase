import { TableOptions } from '@nocobase/database';

export default {
  name: 'routes_permissions',
  title: '页面权限',
  developerMode: true,
  internal: true,
  fields: [
    {
      type: 'string',
      name: 'type',
      title: '关联的表', // 仅 pages 和 collections
    },
    {
      type: 'integer',
      name: 'target_id',
      title: '关联的对象'
    },
    {
      type: 'belongsTo',
      name: 'role'
    },
  ],
} as TableOptions;
