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
      name: 'le_entry_name_uq',
      unique: true,
      fields: ['repoId', 'target', 'kind', 'entryName'],
    },
    {
      name: 'le_entry_path_uq',
      unique: true,
      fields: ['repoId', 'target', 'kind', 'entryPath'],
    },
    {
      name: 'le_entry_health_idx',
      fields: ['repoId', 'healthStatus'],
    },
    {
      name: 'le_entry_commit_idx',
      fields: ['compiledCommitId'],
    },
    {
      name: 'le_entry_code_idx',
      fields: ['runtimeCodeHash'],
    },
    {
      name: 'le_entry_artifact_idx',
      fields: ['artifactHash'],
    },
    {
      name: 'le_entry_input_idx',
      fields: ['compiledInputKey'],
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
      length: 64,
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
      length: 32,
      allowNull: false,
      defaultValue: 'client',
    },
    {
      type: 'string',
      name: 'kind',
      length: 64,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'entryName',
      length: 512,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'entryPath',
      length: 512,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'descriptorPath',
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
      name: 'settingsSchemaHash',
    },
    {
      type: 'string',
      name: 'compiledCommitId',
    },
    {
      type: 'string',
      name: 'compiledInputKey',
    },
    {
      type: 'string',
      name: 'compilerBuildId',
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
      name: 'artifactHash',
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
  ],
});
