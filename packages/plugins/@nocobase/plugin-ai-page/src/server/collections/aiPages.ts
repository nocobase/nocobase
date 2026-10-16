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
  name: 'aiPages',
  dataCategory: 'system',
  migrationRules: ['overwrite', 'schema-only'],
  createdBy: true,
  updatedBy: true,
  fields: [
    { type: 'uid', name: 'id', primaryKey: true },
    { type: 'string', name: 'pageSchemaUid', unique: true },
    { type: 'string', name: 'title' },
    { type: 'text', name: 'draftCode' },
    { type: 'text', name: 'publishedCode' },
    { type: 'integer', name: 'draftRevision', defaultValue: 1 },
    { type: 'integer', name: 'publishedRevision', defaultValue: 0 },
    { type: 'string', name: 'codeVersion', defaultValue: 'v2' },
  ],
});
