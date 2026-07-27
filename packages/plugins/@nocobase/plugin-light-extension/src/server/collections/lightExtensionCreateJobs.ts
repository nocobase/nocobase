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
  name: 'lightExtensionCreateJobs',
  dataCategory: 'system',
  autoGenId: false,
  timestamps: true,
  indexes: [
    {
      name: 'le_cjob_reservation_uq',
      unique: true,
      fields: ['applicationName', 'reservationKey'],
    },
    {
      name: 'le_cjob_claim_idx',
      fields: ['status', 'leaseExpiresAt'],
    },
    {
      name: 'le_cjob_actor_idx',
      fields: ['applicationName', 'actorUserId', 'status'],
    },
    {
      name: 'le_cjob_finished_idx',
      fields: ['status', 'finishedAt'],
    },
  ],
  fields: [
    { type: 'uid', name: 'id', prefix: 'lecj_', primaryKey: true },
    { type: 'string', name: 'applicationName', allowNull: false },
    { type: 'string', name: 'targetRepoId', length: 64, allowNull: false, unique: true },
    { type: 'string', name: 'name', allowNull: false },
    { type: 'string', name: 'normalizedName', allowNull: false },
    { type: 'string', name: 'title' },
    { type: 'text', name: 'description' },
    { type: 'string', name: 'sourceType', length: 32, allowNull: false },
    { type: 'string', name: 'status', length: 32, allowNull: false, defaultValue: 'pending' },
    { type: 'json', name: 'payload' },
    { type: 'string', name: 'resultRepoId', length: 64 },
    { type: 'string', name: 'errorCode' },
    { type: 'text', name: 'errorMessage' },
    { type: 'string', name: 'reservationKey', length: 80 },
    { type: 'string', name: 'claimToken' },
    { type: 'string', name: 'leaseOwner' },
    { type: 'date', name: 'leaseExpiresAt' },
    { type: 'date', name: 'heartbeatAt' },
    { type: 'integer', name: 'attempt', allowNull: false, defaultValue: 0 },
    { type: 'integer', name: 'maxAttempts', allowNull: false, defaultValue: 3 },
    { type: 'string', name: 'actorUserId' },
    { type: 'string', name: 'requestId' },
    { type: 'date', name: 'startedAt' },
    { type: 'date', name: 'finishedAt' },
  ],
});
