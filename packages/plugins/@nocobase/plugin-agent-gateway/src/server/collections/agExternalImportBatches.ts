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
  name: 'agExternalImportBatches',
  tableName: 'ag_external_import_batches',
  dataCategory: 'business',
  migrationRules: ['schema-only'],
  autoGenId: false,
  indexes: [
    {
      unique: true,
      fields: ['batchIdentityKey'],
    },
    {
      unique: true,
      fields: ['runId', 'batchKey'],
    },
    {
      fields: ['status', 'updatedAt'],
    },
    {
      fields: ['status', 'lastAttemptAt', 'id'],
    },
    {
      fields: ['runId', 'status', 'updatedAt'],
    },
  ],
  fields: [
    {
      type: 'uuid',
      name: 'id',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'batchIdentityKey',
      allowNull: false,
    },
    {
      type: 'uuid',
      name: 'identityId',
      autoFill: false,
      allowNull: false,
      index: true,
    },
    {
      type: 'belongsTo',
      name: 'identity',
      target: 'agExternalRunIdentities',
      foreignKey: 'identityId',
      onDelete: 'CASCADE',
    },
    {
      type: 'uuid',
      name: 'runId',
      autoFill: false,
      allowNull: false,
      index: true,
    },
    {
      type: 'belongsTo',
      name: 'run',
      target: 'agRuns',
      foreignKey: 'runId',
      onDelete: 'CASCADE',
    },
    {
      type: 'string',
      name: 'batchKey',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'payloadSha256',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'operationPlanSha256',
      allowNull: false,
    },
    {
      type: 'integer',
      name: 'operationCount',
      allowNull: false,
    },
    {
      type: 'jsonb',
      name: 'operationPlanJson',
    },
    {
      type: 'string',
      name: 'finalizationSha256',
    },
    {
      type: 'jsonb',
      name: 'finalizationJson',
    },
    {
      type: 'string',
      name: 'status',
      allowNull: false,
      defaultValue: 'processing',
      index: true,
    },
    {
      type: 'integer',
      name: 'processedOperations',
      allowNull: false,
      defaultValue: 0,
    },
    {
      type: 'integer',
      name: 'attemptCount',
      allowNull: false,
      defaultValue: 1,
    },
    {
      type: 'date',
      name: 'lastAttemptAt',
      allowNull: false,
    },
    {
      type: 'jsonb',
      name: 'observationCountsJson',
    },
    {
      type: 'boolean',
      name: 'relationUpdated',
      allowNull: false,
      defaultValue: false,
    },
    {
      type: 'text',
      name: 'errorSummary',
      length: 'medium',
    },
    {
      type: 'date',
      name: 'completedAt',
    },
    {
      type: 'bigInt',
      name: 'createdById',
    },
    {
      type: 'belongsTo',
      name: 'createdBy',
      target: 'users',
      foreignKey: 'createdById',
      onDelete: 'SET NULL',
    },
  ],
});
