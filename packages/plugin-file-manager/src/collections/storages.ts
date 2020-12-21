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
    },
    {
      comment: '配置项',
      type: 'jsonb',
      name: 'options',
      defaultValue: {}
    },
    {
      comment: '文件规则',
      type: 'jsonb',
      name: 'rules',
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
    // TODO(feature): 需要使用一个实现了可设置默认值的字段
    {
      comment: '默认引擎',
      type: 'boolean',
      name: 'default',
      defaultValue: false
    },
    {
      type: 'hasMany',
      name: 'attachments'
    }
  ]
} as TableOptions;
