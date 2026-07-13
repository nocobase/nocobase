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
  name: 'agSkillDownloadCapabilities',
  tableName: 'ag_skill_download_capabilities',
  dataCategory: 'system',
  migrationRules: ['schema-only'],
  autoGenId: false,
  indexes: [
    {
      unique: true,
      fields: ['tokenHash'],
    },
    {
      fields: ['runId', 'claimAttempt'],
    },
    {
      fields: ['nodeId', 'skillVersionId', 'expiresAt'],
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
      name: 'tokenHash',
      allowNull: false,
      hidden: true,
    },
    {
      type: 'uuid',
      name: 'nodeId',
      autoFill: false,
      allowNull: false,
    },
    {
      type: 'belongsTo',
      name: 'node',
      target: 'agNodes',
      foreignKey: 'nodeId',
      onDelete: 'CASCADE',
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
      allowNull: false,
    },
    {
      type: 'uuid',
      name: 'skillVersionId',
      autoFill: false,
      allowNull: false,
    },
    {
      type: 'belongsTo',
      name: 'skillVersion',
      target: 'agSkillVersions',
      foreignKey: 'skillVersionId',
      onDelete: 'CASCADE',
    },
    {
      type: 'string',
      name: 'sha256',
      length: 64,
      allowNull: false,
    },
    {
      type: 'date',
      name: 'expiresAt',
      allowNull: false,
      index: true,
    },
  ],
});
