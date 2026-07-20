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
  name: 'vscFileBlobs',
  autoGenId: false,
  fields: [
    {
      type: 'string',
      name: 'hash',
      length: 64,
      primaryKey: true,
    },
    {
      type: 'integer',
      name: 'size',
      allowNull: false,
    },
    {
      type: 'text',
      name: 'content',
      length: 'long',
      allowNull: false,
    },
  ],
});
