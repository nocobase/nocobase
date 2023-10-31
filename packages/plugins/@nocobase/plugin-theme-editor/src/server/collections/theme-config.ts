import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'themeConfig',
  fields: [
    // 主题配置内容，一个 JSON 字符串
    {
      type: 'json',
      name: 'config',
    },
    // 主题是否可选
    {
      type: 'boolean',
      name: 'optional',
    },
    {
      type: 'boolean',
      name: 'isBuiltIn',
    },
    {
      type: 'uid',
      name: 'uid',
    },
  ],
});
