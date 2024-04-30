/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'posts',
  createdBy: true,
  updatedBy: true,
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'boolean',
      name: 'published',
      defaultValue: false,
    },
    {
      type: 'integer',
      name: 'read',
      defaultValue: 0,
    },
    {
      type: 'belongsTo',
      name: 'category',
    },
    {
      type: 'hasMany',
      name: 'comments',
    },
    {
      type: 'belongsToMany',
      name: 'tags',
    },
    {
      type: 'integer',
      name: 'read',
      defaultValue: 0,
    },
  ],
} as CollectionOptions;
