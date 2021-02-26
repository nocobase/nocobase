import { TableOptions } from '@nocobase/database';

export default {
  name: 'menus',
  title: '页面配置',
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
      title: '页面名称',
      required: true,
    },
    {
      interface: 'string',
      type: 'randomString',
      name: 'name',
      title: '缩略名',
      required: true,
      createOnly: true,
      randomString: {
        length: 6,
        characters: 'abcdefghijklmnopqrstuvwxyz0123456789',
      },
      developerMode: true,
    },
    {
      interface: 'radio',
      type: 'string',
      name: 'type',
      title: '类型',
      required: true,
      dataSource: [
        { value: 'default', label: '页面' },
        { value: 'collection', label: '数据集' },
      ],
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'dynamic',
      title: '单条数据子页面',
    },
    {
      interface: 'subTable',
      type: 'hasMany',
      name: 'views',
      title: '视图',
      target: 'pages_views',
      children: [
        {
          interface: 'linkTo',
          type: 'belongsToMany',
          name: 'view',
          title: '视图',
          target: 'views',
        },
        {
          interface: 'percent',
          type: 'float',
          name: 'width',
          title: '宽度',
        },
      ],
    },
    {
      interface: 'linkTo',
      type: 'belongsTo',
      name: 'collection',
      title: '所属数据表',
      target: 'collections',
      targetKey: 'name',
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
