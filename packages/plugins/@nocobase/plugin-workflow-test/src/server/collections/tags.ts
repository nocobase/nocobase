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
  name: 'tags',
  createdBy: true,
  updatedBy: true,
  fields: [
    {
      type: 'belongsToMany',
      name: 'posts',
    },
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'date',
      name: 'createdAt',
    },
    {
      type: 'date',
      name: 'updatedAt',
    },
  ],
} as CollectionOptions;
