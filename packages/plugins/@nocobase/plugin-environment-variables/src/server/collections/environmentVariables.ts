/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';
import { VAR_NAME_RE } from '../../re';

export default defineCollection({
  name: 'environmentVariables',
  autoGenId: false,
  migrationRules: ['schema-only'],
  fields: [
    {
      type: 'string',
      name: 'name',
      primaryKey: true,
      validate: {
        is: VAR_NAME_RE,
      },
    },
    {
      type: 'string',
      name: 'type',
    },
    {
      type: 'text',
      name: 'value',
    },
  ],
});
