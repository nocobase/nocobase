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
  migrationRules: ['overwrite', 'schema-only'],
  autoGenId: false,
  sortable: true,
  name: 'aiMcpClients',
  fields: [
    {
      name: 'name',
      type: 'string',
      primaryKey: true,
    },
    {
      name: 'enabled',
      type: 'boolean',
    },
    {
      name: 'transport',
      type: 'string',
    },
    {
      name: 'command',
      type: 'string',
    },
    {
      name: 'args',
      type: 'jsonb',
    },
    {
      name: 'env',
      type: 'jsonb',
    },
    {
      name: 'url',
      type: 'string',
    },
    {
      name: 'headers',
      type: 'jsonb',
    },
    {
      name: 'restart',
      type: 'jsonb',
    },
  ],
});
