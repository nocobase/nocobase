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
  name: 'agRunEvents',
  tableName: 'ag_run_events',
  dataCategory: 'business',
  migrationRules: ['schema-only'],
  autoGenId: false,
  indexes: [
    {
      unique: true,
      fields: ['runId', 'claimAttempt', 'source', 'sequence'],
    },
    {
      fields: ['runId', 'createdAt'],
    },
    {
      unique: true,
      fields: ['runId', 'ingestId'],
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
      type: 'bigInt',
      name: 'ingestId',
      allowNull: false,
      hidden: true,
    },
    {
      type: 'uuid',
      name: 'runId',
      autoFill: false,
      allowNull: false,
    },
    {
      type: 'integer',
      name: 'claimAttempt',
      defaultValue: 0,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'source',
      allowNull: false,
    },
    {
      type: 'integer',
      name: 'sequence',
      allowNull: false,
    },
    {
      type: 'belongsTo',
      name: 'run',
      target: 'agRuns',
      foreignKey: 'runId',
      onDelete: 'CASCADE',
    },
    {
      type: 'string',
      name: 'level',
      defaultValue: 'info',
    },
    {
      type: 'string',
      name: 'eventType',
      allowNull: false,
    },
    {
      type: 'text',
      name: 'message',
      length: 'medium',
    },
    {
      type: 'jsonb',
      name: 'payloadJson',
    },
    {
      type: 'date',
      name: 'emittedAt',
    },
  ],
});
