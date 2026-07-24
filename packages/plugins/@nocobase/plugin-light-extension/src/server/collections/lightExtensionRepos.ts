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
  name: 'lightExtensionRepos',
  dataCategory: 'system',
  autoGenId: false,
  timestamps: true,
  indexes: [
    {
      name: 'le_repo_name_uq',
      unique: true,
      fields: ['name'],
    },
    {
      name: 'le_repo_normalized_uq',
      unique: true,
      fields: ['normalizedName'],
    },
    {
      name: 'le_repo_vsc_uq',
      unique: true,
      fields: ['vscRepoId'],
    },
    {
      name: 'le_repo_health_idx',
      fields: ['lifecycleStatus', 'healthStatus'],
    },
    {
      name: 'le_repo_application_idx',
      fields: ['applicationName'],
    },
    {
      name: 'le_repo_head_idx',
      fields: ['headCommitId'],
    },
  ],
  fields: [
    {
      type: 'uid',
      name: 'id',
      prefix: 'ler_',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'vscRepoId',
      length: 64,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'applicationName',
    },
    {
      type: 'string',
      name: 'name',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'normalizedName',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'text',
      name: 'description',
    },
    {
      type: 'string',
      name: 'lifecycleStatus',
      allowNull: false,
      defaultValue: 'enabled',
    },
    {
      type: 'string',
      name: 'healthStatus',
      allowNull: false,
      defaultValue: 'pending',
    },
    {
      type: 'string',
      name: 'headCommitId',
    },
    {
      type: 'date',
      name: 'lastCompiledAt',
    },
  ],
});
