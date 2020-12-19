import { TableOptions } from '@nocobase/database';

export default {
  name: 'storages',
  title: '存储引擎',
  internal: true,
  fields: [
    {
      comment: '标识名称，用于用户记忆',
      type: 'string',
      name: 'name',
    },
    {
      comment: '类型标识，如 local/ali-oss 等',
      type: 'string',
      name: 'type',
      defaultValue: 'local'
    },
    {
      comment: '配置项',
      type: 'jsonb',
      name: 'options',
      defaultValue: {}
    },
    {
      comment: '存储相对路径模板',
      type: 'string',
      name: 'path',
      defaultValue: ''
    },
    {
      comment: '访问地址前缀',
      type: 'string',
      name: 'baseUrl',
      defaultValue: ''
    },
  ]
} as TableOptions;
