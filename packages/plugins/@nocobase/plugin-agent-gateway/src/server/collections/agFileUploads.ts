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
  name: 'agFileUploads',
  tableName: 'ag_file_uploads',
  dataCategory: 'business',
  migrationRules: ['schema-only'],
  autoGenId: false,
  indexes: [{ fields: ['status', 'expiresAt'] }],
  fields: [
    { type: 'uuid', name: 'id', primaryKey: true },
    { type: 'string', name: 'purpose', allowNull: false, index: true },
    { type: 'string', name: 'status', allowNull: false, defaultValue: 'pending', index: true },
    { type: 'string', name: 'fileName' },
    { type: 'string', name: 'mimeType' },
    { type: 'bigInt', name: 'expectedBytes', allowNull: false },
    { type: 'bigInt', name: 'receivedBytes', allowNull: false, defaultValue: 0 },
    { type: 'string', name: 'sha256' },
    { type: 'string', name: 'storagePath', allowNull: false, hidden: true },
    { type: 'date', name: 'expiresAt', allowNull: false, index: true },
    { type: 'jsonb', name: 'metadataJson' },
  ],
});
