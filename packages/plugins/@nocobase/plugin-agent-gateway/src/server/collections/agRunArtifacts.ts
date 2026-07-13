/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';

// Portable collection indexes do not expose partial unique indexes. A nullable
// artifactKey plus this composite unique index enforces uniqueness for keyed
// artifacts while still allowing multiple unkeyed artifacts on supported SQL engines.
export const AG_RUN_ARTIFACT_UNIQUE_CONSTRAINT_NOTE =
  'Unique by runId, claimAttempt, artifactKey when artifactKey is present; unkeyed artifacts use nullable artifactKey.';

export default defineCollection({
  name: 'agRunArtifacts',
  tableName: 'ag_run_artifacts',
  dataCategory: 'system',
  migrationRules: ['schema-only'],
  autoGenId: false,
  indexes: [
    {
      unique: true,
      fields: ['runId', 'claimAttempt', 'artifactKey'],
    },
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
      name: 'artifactKey',
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
      name: 'artifactType',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'mimeType',
    },
    {
      type: 'bigInt',
      name: 'sizeBytes',
    },
    {
      type: 'bigInt',
      name: 'originalSizeBytes',
    },
    {
      type: 'bigInt',
      name: 'previewBytes',
    },
    {
      type: 'boolean',
      name: 'truncated',
      defaultValue: false,
    },
    {
      type: 'string',
      name: 'storageMode',
    },
    {
      type: 'string',
      name: 'contentSha256',
    },
    {
      type: 'text',
      name: 'contentText',
      length: 'long',
    },
    {
      type: 'jsonb',
      name: 'metadataJson',
    },
  ],
});
