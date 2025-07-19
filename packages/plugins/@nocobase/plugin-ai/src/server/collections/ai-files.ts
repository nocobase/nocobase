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
  migrationRules: ['schema-only', 'skip'],
  name: 'aiFiles',
  createdBy: true,
  updatedBy: true,
  template: 'file',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'string',
      name: 'filename',
    },
    {
      type: 'string',
      name: 'extname',
    },
    {
      type: 'integer',
      name: 'size',
    },
    {
      type: 'string',
      name: 'mimetype',
    },
    {
      type: 'text',
      name: 'path',
    },
    {
      type: 'text',
      name: 'url',
    },
    {
      type: 'text',
      name: 'preview',
    },
    {
      type: 'belongsTo',
      name: 'storage',
      target: 'storages',
      foreignKey: 'storageId',
    },
    {
      type: 'jsonb',
      name: 'meta',
      deletable: false,
      defaultValue: {},
    },
  ],
});
