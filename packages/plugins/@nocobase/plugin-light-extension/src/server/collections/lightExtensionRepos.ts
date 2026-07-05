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
      unique: true,
      fields: ['name'],
    },
    {
      unique: true,
      fields: ['normalizedName'],
    },
    {
      unique: true,
      fields: ['vscRepoId'],
    },
    {
      fields: ['lifecycleStatus', 'healthStatus'],
    },
    {
      fields: ['headCommitId'],
    },
    {
      fields: ['lastScannedCommitId'],
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
      allowNull: false,
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
      type: 'integer',
      name: 'version',
      allowNull: false,
      defaultValue: 1,
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
      defaultValue: 'draft',
    },
    {
      type: 'string',
      name: 'headCommitId',
    },
    {
      type: 'string',
      name: 'lastScannedCommitId',
    },
    {
      type: 'text',
      name: 'lastError',
    },
    {
      type: 'date',
      name: 'lastScannedAt',
    },
    {
      type: 'date',
      name: 'lastPublishedAt',
    },
  ],
});
