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
  name: 'lightExtensionMoveOperations',
  dataCategory: 'system',
  autoGenId: false,
  timestamps: true,
  migrationRules: ['overwrite', 'schema-only'],
  indexes: [
    {
      name: 'le_move_operation_identity_uq',
      unique: true,
      fields: ['identityHash'],
    },
  ],
  fields: [
    {
      type: 'uid',
      name: 'id',
      prefix: 'lemo_',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'identityHash',
      length: 64,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'applicationName',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'idempotencyKey',
      length: 255,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'requestHash',
      length: 64,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'attemptId',
      length: 36,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'status',
      allowNull: false,
    },
    {
      type: 'json',
      name: 'result',
    },
    {
      type: 'string',
      name: 'errorCode',
    },
  ],
});
