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
  name: 'aiPageRevisions',
  dataCategory: 'system',
  migrationRules: ['overwrite', 'schema-only'],
  createdBy: true,
  fields: [
    { type: 'bigInt', name: 'id', primaryKey: true, autoIncrement: true },
    { type: 'string', name: 'pageSchemaUid', index: true },
    { type: 'integer', name: 'revision' },
    { type: 'text', name: 'code' },
    { type: 'string', name: 'summary' },
    { type: 'boolean', name: 'published', defaultValue: false },
  ],
  indexes: [{ unique: true, fields: ['pageSchemaUid', 'revision'] }],
});
