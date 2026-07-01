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
  name: 'agAgentConversationEvents',
  tableName: 'ag_agent_conversation_events',
  dataCategory: 'business',
  migrationRules: ['schema-only'],
  autoGenId: false,
  indexes: [
    {
      fields: ['runId', 'createdAt', 'sequence'],
    },
    {
      fields: ['sessionId', 'createdAt', 'sequence'],
    },
    {
      unique: true,
      fields: ['runId', 'source', 'providerEventId'],
    },
    {
      unique: true,
      fields: ['runId', 'source', 'sequence'],
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
      type: 'integer',
      name: 'sequence',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'eventType',
      allowNull: false,
      index: true,
    },
    {
      type: 'string',
      name: 'source',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'providerEventId',
    },
    {
      type: 'string',
      name: 'correlationId',
    },
    {
      type: 'float',
      name: 'confidence',
    },
    {
      type: 'text',
      name: 'contentText',
      length: 'medium',
    },
    {
      type: 'jsonb',
      name: 'contentJson',
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
