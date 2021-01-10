import { TableOptions } from '@nocobase/database';

export default {
  name: 'actions_scopes',
  title: '表操作范围',
  fields: [
    {
      comment: '范围名称',
      type: 'string',
      name: 'title',
    },
    {
      comment: '操作范围',
      type: 'jsonb',
      name: 'filter'
    },
    {
      type: 'belongsTo',
      name: 'collection',
      targetKey: 'name'
    }
  ],
} as TableOptions;
