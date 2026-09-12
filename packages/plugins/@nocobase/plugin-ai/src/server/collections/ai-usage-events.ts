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
  migrationRules: ['schema-only'],
  name: 'aiUsageEvents',
  dataCategory: 'business',
  timestamps: false,
  createdAt: false,
  updatedAt: false,
  createdBy: false,
  updatedBy: false,
  fields: [
    {
      name: 'occurredAt',
      type: 'unixTimestamp',
      accuracy: 'millisecond',
      allowNull: false,
    },
    {
      name: 'sessionId',
      type: 'uuid',
      allowNull: false,
    },
    {
      name: 'messageId',
      type: 'bigInt',
      allowNull: false,
    },
    {
      name: 'user',
      type: 'belongsTo',
      target: 'users',
      targetKey: 'id',
      foreignKey: 'userId',
    },
    {
      name: 'aiEmployee',
      type: 'belongsTo',
      target: 'aiEmployees',
      targetKey: 'username',
      foreignKey: 'aiEmployeeUsername',
    },
    {
      name: 'from',
      type: 'string',
      allowNull: false,
      defaultValue: 'main-agent',
    },
    {
      name: 'category',
      type: 'string',
      allowNull: false,
      defaultValue: 'chat',
    },
    {
      name: 'eventType',
      type: 'string',
      allowNull: false,
      defaultValue: 'llm_message',
    },
    {
      name: 'role',
      type: 'string',
      allowNull: false,
    },
    {
      name: 'provider',
      type: 'string',
    },
    {
      name: 'llmService',
      type: 'string',
    },
    {
      name: 'model',
      type: 'string',
    },
    {
      name: 'inputTokens',
      type: 'bigInt',
      allowNull: false,
      defaultValue: 0,
    },
    {
      name: 'outputTokens',
      type: 'bigInt',
      allowNull: false,
      defaultValue: 0,
    },
    {
      name: 'totalTokens',
      type: 'bigInt',
      allowNull: false,
      defaultValue: 0,
    },
    {
      name: 'cachedTokens',
      type: 'bigInt',
      allowNull: false,
      defaultValue: 0,
    },
    {
      name: 'reasoningTokens',
      type: 'bigInt',
      allowNull: false,
      defaultValue: 0,
    },
    {
      name: 'toolCallCount',
      type: 'integer',
      allowNull: false,
      defaultValue: 0,
    },
    {
      name: 'autoToolCallCount',
      type: 'integer',
      allowNull: false,
      defaultValue: 0,
    },
    {
      name: 'status',
      type: 'string',
      allowNull: false,
      defaultValue: 'success',
    },
    {
      name: 'rawUsageMetadata',
      type: 'jsonb',
    },
    {
      name: 'rawResponseMetadata',
      type: 'jsonb',
    },
  ],
  indexes: [
    {
      fields: ['messageId', 'eventType'],
      unique: true,
    },
    {
      fields: ['occurredAt'],
    },
    {
      fields: ['userId', 'occurredAt'],
    },
    {
      fields: ['aiEmployeeUsername', 'occurredAt'],
    },
    {
      fields: ['sessionId'],
    },
  ],
});
