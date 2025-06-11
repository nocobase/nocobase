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
  origin: '@nocobase/plugin-pod-sync',
  name: 'systemManagement',
  dataType: 'meta',
  timestamps: false,
  dumpRules: 'required',
  fields: [
    {
      name: 'key',
      type: 'string',
    },
    {
      name: 'value',
      type: 'string',
    },
    {
      comment: '类别',
      name: 'type',
      type: 'string',
    },
  ],
});
