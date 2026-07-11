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
  name: 'agApiCallLogs',
  tableName: 'ag_api_call_logs',
  dataCategory: 'business',
  migrationRules: ['schema-only'],
  autoGenId: false,
  indexes: [
    {
      fields: ['runId', 'createdAt'],
    },
    {
      fields: ['createdAt'],
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
    },
    {
      type: 'belongsTo',
      name: 'run',
      target: 'agRuns',
      foreignKey: 'runId',
      onDelete: 'CASCADE',
    },
    {
      type: 'belongsTo',
      name: 'node',
      target: 'agNodes',
      foreignKey: 'nodeId',
      onDelete: 'SET NULL',
    },
    {
      type: 'string',
      name: 'direction',
      allowNull: false,
      index: true,
    },
    {
      type: 'string',
      name: 'requestId',
      index: true,
    },
    {
      type: 'string',
      name: 'method',
    },
    {
      type: 'string',
      name: 'path',
    },
    {
      type: 'integer',
      name: 'statusCode',
    },
    {
      type: 'integer',
      name: 'durationMs',
    },
    {
      type: 'jsonb',
      name: 'requestSummaryJson',
    },
    {
      type: 'jsonb',
      name: 'responseSummaryJson',
    },
    {
      type: 'text',
      name: 'errorSummary',
      length: 'medium',
    },
  ],
});
