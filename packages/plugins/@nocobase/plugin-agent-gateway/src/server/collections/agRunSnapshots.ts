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
  name: 'agRunSnapshots',
  tableName: 'ag_run_snapshots',
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
      type: 'uuid',
      name: 'runId',
      autoFill: false,
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
      type: 'integer',
      name: 'claimAttempt',
      defaultValue: 0,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'snapshotType',
      allowNull: false,
    },
    {
      type: 'jsonb',
      name: 'snapshotJson',
    },
    {
      type: 'jsonb',
      name: 'metadataJson',
    },
    {
      type: 'date',
      name: 'capturedAt',
    },
  ],
});
