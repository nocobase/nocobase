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
  name: 'aiSkills',
  fields: [
    {
      name: 'name',
      type: 'string',
      primaryKey: true,
    },
    {
      name: 'scope',
      type: 'string',
    },
    {
      name: 'description',
      type: 'text',
    },
    {
      name: 'content',
      type: 'text',
    },
    {
      name: 'tools',
      type: 'jsonb',
    },
  ],
});
