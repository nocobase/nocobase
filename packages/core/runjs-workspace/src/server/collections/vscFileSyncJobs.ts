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
      name: 'vscjob_remote_key_uq',
      unique: true,
      fields: ['remoteId', 'remoteTargetVersion', 'idempotencyKey'],
    },
    {
      name: 'vscjob_remote_status_idx',
      fields: ['remoteId', 'status'],
    },
    {
      name: 'vscjob_lease_idx',
      fields: ['status', 'leaseExpiresAt'],
    },
    {
      name: 'vscjob_created_idx',
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
      length: 32,
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
      length: 255,
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
