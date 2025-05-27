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
  migrationRules: ['schema-only'],
  autoGenId: false,
  name: 'aiMessages',
  fields: [
    {
      name: 'messageId',
      type: 'bigInt',
      primaryKey: true,
    },
    {
      name: 'role',
      type: 'string',
    },
    {
      name: 'content',
      type: 'jsonb',
    },
    {
      name: 'toolCalls',
      type: 'jsonb',
    },
    {
      name: 'attachments',
      type: 'jsonb',
    },
    {
      name: 'metadata',
      type: 'jsonb',
    },
  ],
});
