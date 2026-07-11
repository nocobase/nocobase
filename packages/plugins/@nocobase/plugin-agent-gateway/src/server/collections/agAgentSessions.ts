/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';

// Portable collection indexes do not expose partial unique indexes. Nullable
// providerSessionId keeps the identity unique per node when the provider gives
// us one, while still allowing transitional rows without a provider-owned id.
export const AG_AGENT_SESSION_PROVIDER_ID_UNIQUE_CONSTRAINT_NOTE =
  'Unique by node, provider, and providerSessionId when providerSessionId is present; transitional sessions may leave it null.';

export default defineCollection({
  name: 'agAgentSessions',
  tableName: 'ag_agent_sessions',
  dataCategory: 'business',
  migrationRules: ['schema-only'],
  autoGenId: false,
  indexes: [
    {
      unique: true,
      fields: ['nodeId', 'provider', 'providerSessionId'],
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
      name: 'provider',
      allowNull: false,
      index: true,
    },
    {
      type: 'string',
      name: 'providerSessionId',
    },
    {
      type: 'uuid',
      name: 'nodeId',
      autoFill: false,
      index: true,
    },
    {
      type: 'belongsTo',
      name: 'node',
      target: 'agNodes',
      foreignKey: 'nodeId',
      onDelete: 'SET NULL',
    },
    {
      type: 'uuid',
      name: 'rootRunId',
      autoFill: false,
      index: true,
    },
    {
      type: 'belongsTo',
      name: 'rootRun',
      target: 'agRuns',
      foreignKey: 'rootRunId',
      onDelete: 'SET NULL',
    },
    {
      type: 'uuid',
      name: 'latestRunId',
      autoFill: false,
      index: true,
    },
    {
      type: 'belongsTo',
      name: 'latestRun',
      target: 'agRuns',
      foreignKey: 'latestRunId',
      onDelete: 'SET NULL',
    },
    {
      type: 'string',
      name: 'status',
      defaultValue: 'unknown',
      index: true,
    },
    {
      type: 'jsonb',
      name: 'capabilitiesJson',
    },
    {
      type: 'jsonb',
      name: 'metadataJson',
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
