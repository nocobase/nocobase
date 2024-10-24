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
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'belongsTo',
      name: 'avatar',
      target: 'attachments',
    },
    {
      type: 'hasMany',
      name: 'files',
    },
    {
      type: 'belongsToMany',
      name: 'pubkeys',
      target: 'attachments',
    },
    {
      type: 'belongsToMany',
      name: 'photos',
      target: 'attachments',
    },
  ],
} as CollectionOptions;
