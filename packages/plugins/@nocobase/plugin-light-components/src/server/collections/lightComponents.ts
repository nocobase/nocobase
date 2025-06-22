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
  dumpRules: 'required',
  name: 'lightComponents',
  autoGenId: false,
  migrationRules: ['overwrite', 'schema-only'],
  createdBy: true,
  updatedBy: true,
  logging: true,
  fields: [
    {
      type: 'uid',
      name: 'key',
      primaryKey: true,
      prefix: 'lc_',
    },
    {
      type: 'string',
      name: 'title',
      required: true,
    },
    {
      type: 'text',
      name: 'description',
    },
    {
      type: 'text',
      name: 'template',
    },
    {
      type: 'json',
      name: 'flows',
      defaultValue: [],
    },
  ],
});
