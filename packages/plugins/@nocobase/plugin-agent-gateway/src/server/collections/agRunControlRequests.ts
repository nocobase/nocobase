/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';

export const AG_RUN_CONTROL_REQUEST_UNIQUE_CONSTRAINT_NOTE =
  'Unique by requestKey when requestKey is present; requests without idempotency may leave requestKey null.';

export default defineCollection({
  name: 'agRunControlRequests',
  tableName: 'ag_run_control_requests',
  dataCategory: 'business',
  migrationRules: ['schema-only'],
  autoGenId: false,
  indexes: [
    {
      unique: true,
      fields: ['requestKey'],
    },
    {
      fields: ['runId', 'status', 'createdAt'],
    },
  ],
  fields: [
    {
      type: 'uuid',
      name: 'id',
      primaryKey: true,
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
      type: 'uuid',
      name: 'agentSessionId',
      autoFill: false,
      index: true,
    },
    {
      type: 'belongsTo',
      name: 'agentSession',
      target: 'agAgentSessions',
      foreignKey: 'agentSessionId',
      onDelete: 'SET NULL',
    },
    {
      type: 'string',
      name: 'action',
      allowNull: false,
      index: true,
    },
    {
      type: 'text',
      name: 'reason',
      length: 'medium',
    },
    {
      type: 'string',
      name: 'idempotencyKey',
    },
    {
      type: 'string',
      name: 'requestKey',
      unique: true,
    },
    {
      type: 'bigInt',
      name: 'requestedById',
    },
    {
      type: 'belongsTo',
      name: 'requestedBy',
      target: 'users',
      foreignKey: 'requestedById',
      onDelete: 'SET NULL',
    },
    {
      type: 'string',
      name: 'status',
      defaultValue: 'accepted',
      allowNull: false,
      index: true,
    },
    {
      type: 'text',
      name: 'resultMessage',
      length: 'medium',
    },
    {
      type: 'jsonb',
      name: 'metadataJson',
    },
    {
      type: 'date',
      name: 'deliveredAt',
    },
    {
      type: 'date',
      name: 'completedAt',
    },
  ],
});
