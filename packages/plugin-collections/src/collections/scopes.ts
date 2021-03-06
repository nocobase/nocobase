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
  views_v2: [
    {
      type: 'table',
      name: 'table',
      title: '全部数据',
      labelField: 'title',
      actions: [
        {
          name: 'create',
          type: 'create',
          title: '新增',
          viewName: 'form',
        },
        {
          name: 'destroy',
          type: 'destroy',
          title: '删除',
        },
      ],
      fields: ['title'],
      detailsOpenMode: 'drawer', // window
      details: ['form'],
      sort: ['id'],
    },
    {
      type: 'form',
      name: 'form',
      title: '表单',
      fields: [
        'title',
        'filter',
      ],
    },
  ],
  pages_v2: [
    {
      title: '表格',
      name: 'all',
      views: ['table'],
    },
    {
      title: '表单',
      name: 'form',
      views: ['form'],
    },
  ],
} as TableOptions;
