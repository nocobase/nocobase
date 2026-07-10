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
  name: 'lightExtensionEntries',
  dataCategory: 'system',
  autoGenId: false,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['repoId', 'target', 'kind', 'entryName'],
    },
    {
      unique: true,
      fields: ['repoId', 'target', 'kind', 'entryPath'],
    },
    {
      fields: ['repoId', 'healthStatus'],
    },
    {
      fields: ['compiledCommitId'],
    },
    {
      fields: ['runtimeCodeHash'],
    },
    {
      fields: ['repoId', 'lastScannedCommitId'],
    },
  ],
  fields: [
    {
      type: 'uid',
      name: 'id',
      prefix: 'lee_',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'repoId',
      allowNull: false,
    },
    {
      type: 'belongsTo',
      name: 'repo',
      target: 'lightExtensionRepos',
      targetKey: 'id',
      foreignKey: 'repoId',
      constraints: false,
    },
    {
      type: 'string',
      name: 'target',
      allowNull: false,
      defaultValue: 'client',
    },
    {
      type: 'string',
      name: 'kind',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'entryName',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'entryPath',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'metaPath',
    },
    {
      type: 'string',
      name: 'settingsPath',
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
      name: 'category',
    },
    {
      type: 'string',
      name: 'icon',
    },
    {
      type: 'json',
      name: 'tags',
    },
    {
      type: 'integer',
      name: 'sort',
    },
    {
      type: 'json',
      name: 'settingsSchema',
    },
    {
      type: 'string',
      name: 'compiledCommitId',
    },
    {
      type: 'json',
      name: 'runtimeArtifact',
    },
    {
      type: 'string',
      name: 'runtimeVersion',
    },
    {
      type: 'string',
      name: 'surfaceStyle',
    },
    {
      type: 'string',
      name: 'runtimeCodeHash',
    },
    {
      type: 'string',
      name: 'filesHash',
    },
    {
      type: 'string',
      name: 'settingsDefaultsHash',
    },
    {
      type: 'date',
      name: 'compiledAt',
    },
    {
      type: 'string',
      name: 'healthStatus',
      allowNull: false,
      defaultValue: 'missing',
    },
    {
      type: 'json',
      name: 'diagnostics',
    },
    {
      type: 'string',
      name: 'validatorVersion',
    },
    {
      type: 'string',
      name: 'lastScannedCommitId',
    },
    {
      type: 'date',
      name: 'lastScannedAt',
    },
  ],
});
