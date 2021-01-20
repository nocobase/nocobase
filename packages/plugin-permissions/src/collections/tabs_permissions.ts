import { TableOptions } from '@nocobase/database';

export default {
  name: 'tabs_permissions',
  title: '标签页访问权限',
  developerMode: true,
  internal: true,
  fields: [
    {
      type: 'belongsTo',
      name: 'permission',
    },
    {
      type: 'belongsTo',
      name: 'tab'
    },
  ],
} as TableOptions;
