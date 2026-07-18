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
  name: 'vscFileSyncJobs',
  autoGenId: false,
  indexes: [
    {
      name: 'vsc_file_sync_jobs_remote_id_remote_target_version_idempotency_',
      unique: true,
      fields: ['remoteId', 'remoteTargetVersion', 'idempotencyKey'],
    },
    {
      fields: ['remoteId', 'status'],
    },
    {
      fields: ['status', 'leaseExpiresAt'],
    },
    {
      fields: ['remoteId', 'remoteTargetVersion', 'createdAt'],
    },
  ],
  fields: [
    {
      type: 'uid',
      name: 'id',
      prefix: 'vscjob_',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'remoteId',
      allowNull: false,
    },
    {
      type: 'belongsTo',
      name: 'remote',
      target: 'vscFileRemotes',
      targetKey: 'id',
      foreignKey: 'remoteId',
      constraints: true,
      onDelete: 'CASCADE',
    },
    {
      type: 'integer',
      name: 'remoteTargetVersion',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'operation',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'status',
      allowNull: false,
      defaultValue: 'pending',
    },
    {
      type: 'string',
      name: 'phase',
      allowNull: false,
      defaultValue: 'prepared',
    },
    {
      type: 'string',
      name: 'idempotencyKey',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'planFingerprint',
      allowNull: true,
    },
    {
      type: 'string',
      name: 'expectedLocalCommitId',
      allowNull: true,
    },
    {
      type: 'string',
      name: 'expectedRemoteRevision',
      allowNull: true,
    },
    {
      type: 'string',
      name: 'resultLocalCommitId',
      allowNull: true,
    },
    {
      type: 'string',
      name: 'resultRemoteRevision',
      allowNull: true,
    },
    {
      type: 'string',
      name: 'contentHash',
      length: 128,
      allowNull: true,
    },
    {
      type: 'string',
      name: 'claimToken',
      allowNull: true,
    },
    {
      type: 'string',
      name: 'leaseOwner',
      allowNull: true,
    },
    {
      type: 'date',
      name: 'leaseExpiresAt',
      allowNull: true,
    },
    {
      type: 'date',
      name: 'heartbeatAt',
      allowNull: true,
    },
    {
      type: 'integer',
      name: 'attempt',
      allowNull: false,
      defaultValue: 0,
    },
    {
      type: 'integer',
      name: 'maxAttempts',
      allowNull: false,
      defaultValue: 3,
    },
    {
      type: 'date',
      name: 'startedAt',
      allowNull: true,
    },
    {
      type: 'date',
      name: 'finishedAt',
      allowNull: true,
    },
    {
      type: 'string',
      name: 'lastErrorCode',
      allowNull: true,
    },
  ],
});
