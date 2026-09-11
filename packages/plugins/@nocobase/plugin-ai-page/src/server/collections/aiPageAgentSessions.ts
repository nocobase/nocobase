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
  name: 'aiPageAgentSessions',
  dataCategory: 'system',
  migrationRules: ['overwrite', 'schema-only'],
  createdBy: true,
  fields: [
    { type: 'string', name: 'sessionId', primaryKey: true },
    { type: 'string', name: 'pageSchemaUid', index: true },
    { type: 'string', name: 'pairingCodeHash' },
    { type: 'string', name: 'accessTokenHash' },
    { type: 'string', name: 'status', defaultValue: 'pending' },
    { type: 'date', name: 'expiresAt' },
    { type: 'date', name: 'lastSeenAt' },
  ],
});
