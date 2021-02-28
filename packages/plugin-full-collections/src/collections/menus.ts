import { TableOptions } from '@nocobase/database';

export default {
  name: 'menus',
  title: '菜单配置',
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
      title: '菜单名称',
      required: true,
    },
    {
      interface: 'icon',
      type: 'string',
      name: 'icon',
      title: '图标',
      component: {
        type: 'icon',
      },
    },
    {
      interface: 'radio',
      type: 'string',
      name: 'type',
      title: '菜单类型',
      required: true,
      dataSource: [
        { value: 'group', label: '菜单组' },
        { value: 'link', label: '自定义链接' },
        { value: 'page', label: '页面' },
      ],
      linkages: [
        {
          "type": "value:visible",
          "target": "page",
          "condition": "{{ $self.value === 'page' }}"
        },
        {
          "type": "value:visible",
          "target": "url",
          "condition": "{{ $self.value === 'link' }}"
        },
      ],
    },
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'page',
      title: '页面',
      target: 'pages',
      // targetKey: 'name',
    },
    {
      interface: 'string',
      type: 'string',
      name: 'url',
      title: '链接地址',
      required: true,
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'developerMode',
      title: '开发者模式',
      developerMode: true,
      defaultValue: false,
    },
    {
      interface: 'json',
      type: 'json',
      name: 'options',
      title: '配置信息',
      defaultValue: {},
      developerMode: true,
    },
  ],
} as TableOptions;
