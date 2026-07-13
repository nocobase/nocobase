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
  name: 'agExternalRunIdentities',
  tableName: 'ag_external_run_identities',
  dataCategory: 'system',
  migrationRules: ['schema-only'],
  autoGenId: false,
  indexes: [
    {
      unique: true,
      fields: ['identityKey'],
    },
    {
      unique: true,
      fields: ['runId'],
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
      name: 'identityKey',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'identityType',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'provider',
      allowNull: false,
      index: true,
    },
    {
      type: 'text',
      name: 'externalRunKey',
      length: 'medium',
    },
    {
      type: 'string',
      name: 'runCode',
      allowNull: false,
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
    {
      type: 'jsonb',
      name: 'metadataJson',
    },
  ],
});
