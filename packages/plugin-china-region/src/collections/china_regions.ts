import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'china_regions',
  title: '中国行政区划',
  fields: [
    // 如使用代码作为 id 可能更节省，但由于代码数字最长为 12 字节，除非使用 bigint(64) 才够放置
    {
      name: 'code',
      type: 'string',
      unique: true,
    },
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'parent',
      type: 'belongsTo',
      target: 'china_regions',
      targetKey: 'code',
      foreignKey: 'parent_code',
    },
    {
      name: 'children',
      type: 'hasMany',
      target: 'china_regions',
      sourceKey: 'code',
      foreignKey: 'parent_code',
    },
    {
      name: 'level',
      type: 'integer',
    },
  ],
} as CollectionOptions;
