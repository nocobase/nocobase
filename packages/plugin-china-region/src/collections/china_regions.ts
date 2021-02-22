import { TableOptions } from '@nocobase/database';

export default {
  name: 'china_regions',
  title: '中国行政区划',
  internal: true,
  developerMode: true,
  fields: [
    // 如使用代码作为 id 可能更节省，但由于代码数字最长为 12 字节，除非使用 bigint(64) 才够放置
    {
      name: 'code',
      title: '代码',
      interface: 'string',
      type: 'string',
      unique: true,
    },
    {
      name: 'name',
      title: '名称',
      interface: 'string',
      type: 'string',
    },
    {
      name: 'parent',
      title: '从属',
      interface: 'linkTo',
      type: 'belongsTo',
      target: 'china_regions',
      targetKey: 'code',
      foreignKey: 'parent_code',
    },
    {
      name: 'children',
      title: '下辖',
      interface: 'linkTo',
      type: 'hasMany',
      target: 'china_regions',
      sourceKey: 'code',
      foreignKey: 'parent_code'
    },
    {
      name: 'level',
      title: '层级',
      type: 'integer'
    }
  ]
} as TableOptions;
