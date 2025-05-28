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
  dumpRules: {
    group: 'log',
  },
  migrationRules: ['schema-only', 'skip'],
  name: 'otpRecords',
  shared: true,
  fields: [
    {
      type: 'uuid',
      name: 'id',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'action',
    },
    {
      type: 'string',
      name: 'receiver',
    },
    {
      type: 'integer',
      name: 'status',
      defaultValue: 0,
    },
    {
      type: 'unixTimestamp',
      name: 'expiresAt',
      accuracy: 'millisecond',
    },
    {
      type: 'string',
      name: 'code',
    },
    {
      type: 'belongsTo',
      name: 'verifier',
      target: 'verifiers',
      targetKey: 'name',
    },
  ],
});
