import { TableOptions } from '@nocobase/database';

export default {
  name: 'scopes',
  title: '表操作范围',
  developerMode: true,
  internal: true,
  fields: [
    {
      comment: '范围名称',
      type: 'string',
      name: 'title',
      title: '名称',
      component: {
        type: 'string',
        showInTable: true,
        showInForm: true,
      },
    },
    {
      interface: 'json',
      type: 'jsonb',
      name: 'filter',
      title: '条件',
      developerMode: false,
      mode: 'replace',
      defaultValue: {},
      component: {
        type: 'filter',
        showInForm: true,
      },
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'locked',
      title: '锁定',
      defaultValue: false,
      component: {
        showInTable: true,
      }
    },
    {
      type: 'belongsTo',
      name: 'collection',
      targetKey: 'name',
      onDelete: 'CASCADE'
    }
  ],
} as TableOptions;
