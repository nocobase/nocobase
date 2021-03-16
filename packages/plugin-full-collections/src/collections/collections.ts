import { TableOptions } from '@nocobase/database';

export default {
  name: 'collections',
  title: '数据表配置',
  internal: true,
  model: 'CollectionModel',
  developerMode: true,
  createdAt: false,
  updatedAt: false,
  fields: [
    {
      interface: 'string',
      type: 'string',
      name: 'title',
      title: '数据表名称',
      required: true,
    },
    {
      interface: 'string',
      type: 'randomString',
      name: 'name',
      randomString: {
        length: 10,
        template: 't_%r',
        characters: 'abcdefghijklmnopqrstuvwxyz0123456789',
      },
      createOnly: true,
      title: '标识',
      unique: true,
      required: true,
      developerMode: true,
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'developerMode',
      title: '开发者模式',
      developerMode: true,
      defaultValue: false,
      component: {
        type: 'boolean',
      },
    },
    {
      interface: 'json',
      type: 'json',
      name: 'options',
      title: '配置信息',
      defaultValue: {},
      component: {
        type: 'hidden',
      },
    },
    {
      interface: 'boolean',
      type: 'boolean',
      name: 'internal',
      title: '系统内置',
      defaultValue: false,
      developerMode: true,
      component: {
        type: 'boolean',
      },
    },
    {
      interface: 'linkTo',
      type: 'hasMany',
      name: 'fields',
      title: '字段',
      sourceKey: 'name',
    },
    {
      interface: 'linkTo',
      type: 'hasMany',
      name: 'actions',
      title: '操作方法',
      sourceKey: 'name',
    },
  ],
} as TableOptions;
