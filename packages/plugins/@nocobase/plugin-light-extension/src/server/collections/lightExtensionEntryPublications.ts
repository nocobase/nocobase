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
  name: 'lightExtensionEntryPublications',
  dataCategory: 'system',
  autoGenId: false,
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['entryId', 'commitId', 'filesHash', 'runtimeCodeHash', 'settingsDefaultsHash'],
    },
    {
      fields: ['repoId', 'entryId'],
    },
    {
      fields: ['commitId'],
    },
    {
      fields: ['runtimeCodeHash'],
    },
    {
      fields: ['settingsSchemaHash'],
    },
  ],
  fields: [
    {
      type: 'uid',
      name: 'id',
      prefix: 'lep_',
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
      name: 'entryId',
      allowNull: false,
    },
    {
      type: 'belongsTo',
      name: 'entry',
      target: 'lightExtensionEntries',
      targetKey: 'id',
      foreignKey: 'entryId',
      constraints: false,
    },
    {
      type: 'string',
      name: 'commitId',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'entryPath',
      allowNull: false,
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
      name: 'surfaceStyle',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'runtimeVersion',
      allowNull: false,
    },
    {
      type: 'json',
      name: 'artifact',
      allowNull: false,
    },
    {
      type: 'json',
      name: 'settingsSchemaSnapshot',
    },
    {
      type: 'json',
      name: 'settingsDefaultsSnapshot',
    },
    {
      type: 'string',
      name: 'settingsSchemaHash',
    },
    {
      type: 'string',
      name: 'settingsDefaultsHash',
    },
    {
      type: 'string',
      name: 'filesHash',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'runtimeCodeHash',
      allowNull: false,
    },
    {
      type: 'json',
      name: 'diagnostics',
    },
    {
      type: 'string',
      name: 'createdById',
    },
    {
      type: 'string',
      name: 'createdFromRequestSource',
    },
    {
      type: 'date',
      name: 'createdAt',
    },
  ],
});
