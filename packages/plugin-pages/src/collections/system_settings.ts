import { TableOptions } from '@nocobase/database';

export default {
  name: 'system_settings',
  title: '系统配置',
  internal: true,
  // model: 'CollectionModel',
  developerMode: true,
  createdAt: false,
  updatedAt: false,
  fields: [
    {
      interface: 'string',
      type: 'string',
      name: 'title',
      title: '系统名称',
    },
    {
      interface: 'attachment',
      type: 'belongsTo',
      name: 'logo',
      filterable: false,
      target: 'attachments',
      title: 'LOGO',
      component: {
        'x-component-props': {
          multiple: false,
        },
      },
    },
  ],
  actions: [
    {
      type: 'list',
      name: 'list',
      title: '查看',
    },
    {
      type: 'create',
      name: 'create',
      title: '新增',
      viewName: 'form',
    },
    {
      type: 'update',
      name: 'update',
      title: '编辑',
      viewName: 'form',
    },
    {
      type: 'destroy',
      name: 'destroy',
      title: '删除',
    },
  ],
  views_v2: [
    {
      developerMode: true,
      type: 'form',
      name: 'form',
      title: '表单',
      fields: ['title', 'logo'],
    },
    {
      developerMode: true,
      type: 'descriptions',
      name: 'descriptions',
      title: '详情',
      fields: ['title', 'logo'],
      actions: [
        {
          name: 'update',
          type: 'update',
          title: '编辑',
          viewName: 'form',
        },
      ],
    },
  ],
} as TableOptions;
