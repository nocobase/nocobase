/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'themeConfig',
  dumpRules: 'required',
  migrationRules: ['overwrite', 'schema-only'],
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
    {
      type: 'radio',
      name: 'default',
      defaultValue: false,
    },
  ],
});
