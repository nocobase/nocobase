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
  name: 'agRuns',
  tableName: 'ag_runs',
  dataCategory: 'business',
  migrationRules: ['schema-only'],
  autoGenId: false,
  fields: [
    {
      type: 'uuid',
      name: 'id',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'runCode',
      unique: true,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'status',
      defaultValue: 'queued',
      allowNull: false,
      index: true,
    },
    {
      type: 'integer',
      name: 'claimAttempt',
      defaultValue: 0,
      allowNull: false,
    },
    {
      type: 'integer',
      name: 'leaseVersion',
      defaultValue: 0,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'claimTokenHash',
      hidden: true,
    },
    {
      type: 'string',
      name: 'claimTokenLast4',
    },
    {
      type: 'date',
      name: 'claimExpiresAt',
    },
    {
      type: 'date',
      name: 'lastRunHeartbeatAt',
    },
    {
      type: 'boolean',
      name: 'cancelRequested',
      defaultValue: false,
      allowNull: false,
    },
    {
      type: 'date',
      name: 'cancelRequestedAt',
    },
    {
      type: 'date',
      name: 'cancelAckAt',
    },
    {
      type: 'jsonb',
      name: 'promptSnapshot',
      hidden: true,
    },
    {
      type: 'jsonb',
      name: 'executionPayloadJson',
      hidden: true,
    },
    {
      type: 'jsonb',
      name: 'resultSummaryJson',
    },
    {
      type: 'text',
      name: 'errorSummary',
      length: 'medium',
    },
    {
      type: 'string',
      name: 'sourceType',
    },
    {
      type: 'string',
      name: 'sourceCollection',
    },
    {
      type: 'string',
      name: 'sourceRecordId',
    },
    {
      type: 'date',
      name: 'requestedAt',
    },
    {
      type: 'date',
      name: 'queuedAt',
    },
    {
      type: 'date',
      name: 'claimedAt',
    },
    {
      type: 'date',
      name: 'startedAt',
    },
    {
      type: 'date',
      name: 'completedAt',
    },
    {
      type: 'date',
      name: 'failedAt',
    },
    {
      type: 'date',
      name: 'canceledAt',
    },
    {
      type: 'date',
      name: 'finishedAt',
    },
    {
      type: 'string',
      name: 'terminalBackend',
    },
    {
      type: 'string',
      name: 'terminalSessionName',
    },
    {
      type: 'string',
      name: 'terminalStatus',
      index: true,
    },
    {
      type: 'date',
      name: 'terminalStartedAt',
    },
    {
      type: 'date',
      name: 'terminalEndedAt',
    },
    {
      type: 'date',
      name: 'terminalLastActivityAt',
    },
    {
      type: 'integer',
      name: 'terminalExitCode',
    },
    {
      type: 'belongsTo',
      name: 'node',
      target: 'agNodes',
      foreignKey: 'nodeId',
      onDelete: 'SET NULL',
    },
    {
      type: 'belongsTo',
      name: 'agentProfile',
      target: 'agAgentProfiles',
      foreignKey: 'agentProfileId',
      onDelete: 'SET NULL',
    },
    {
      type: 'belongsTo',
      name: 'promptTemplate',
      target: 'agPromptTemplates',
      foreignKey: 'promptTemplateId',
      onDelete: 'SET NULL',
    },
    {
      type: 'belongsTo',
      name: 'dispatchBinding',
      target: 'agDispatchBindings',
      foreignKey: 'dispatchBindingId',
      onDelete: 'SET NULL',
    },
  ],
});
