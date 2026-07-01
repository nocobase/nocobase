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
  name: 'agAgentActionAudits',
  tableName: 'ag_agent_action_audits',
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
      name: 'action',
      allowNull: false,
      index: true,
    },
    {
      type: 'uuid',
      name: 'runId',
      autoFill: false,
      index: true,
    },
    {
      type: 'belongsTo',
      name: 'run',
      target: 'agRuns',
      foreignKey: 'runId',
      onDelete: 'SET NULL',
    },
    {
      type: 'uuid',
      name: 'sessionId',
      autoFill: false,
      index: true,
    },
    {
      type: 'belongsTo',
      name: 'session',
      target: 'agAgentSessions',
      foreignKey: 'sessionId',
      onDelete: 'SET NULL',
    },
    {
      type: 'bigInt',
      name: 'operatorId',
    },
    {
      type: 'belongsTo',
      name: 'operator',
      target: 'users',
      foreignKey: 'operatorId',
      onDelete: 'SET NULL',
    },
    {
      type: 'text',
      name: 'redactedPreview',
      length: 'medium',
    },
    {
      type: 'string',
      name: 'contentHash',
    },
    {
      type: 'bigInt',
      name: 'contentSize',
    },
    {
      type: 'string',
      name: 'permissionKey',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'resultStatus',
      allowNull: false,
      index: true,
    },
    {
      type: 'string',
      name: 'provider',
    },
    {
      type: 'jsonb',
      name: 'metadataJson',
    },
  ],
});
