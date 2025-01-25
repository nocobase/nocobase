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
  dumpRules: 'skipped',
  migrationRules: ['schema-only', 'overwrite'],
  name: 'chinaRegions',
  autoGenId: false,
  fields: [
    // 如使用代码作为 id 可能更节省，但由于代码数字最长为 12 字节，除非使用 bigint(64) 才够放置
    {
      name: 'code',
      type: 'string',
      // unique: true,
      primaryKey: true,
    },
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'parent',
      type: 'belongsTo',
      target: 'chinaRegions',
      targetKey: 'code',
      foreignKey: 'parentCode',
    },
    {
      name: 'children',
      type: 'hasMany',
      target: 'chinaRegions',
      sourceKey: 'code',
      foreignKey: 'parentCode',
    },
    {
      name: 'level',
      type: 'integer',
    },
  ],
});
