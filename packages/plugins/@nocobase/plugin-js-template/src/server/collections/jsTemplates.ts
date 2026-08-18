/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';

import { JS_TEMPLATE_COLLECTIONS } from '../../constants';

export default defineCollection({
  name: JS_TEMPLATE_COLLECTIONS.templates,
  dataCategory: 'system',
  autoGenId: false,
  timestamps: true,
  indexes: [
    {
      name: 'jst_template_name_uq',
      unique: true,
      fields: ['projectId', 'target', 'kind', 'templateName'],
    },
    {
      name: 'jst_template_path_uq',
      unique: true,
      fields: ['projectId', 'target', 'kind', 'entryPath'],
    },
    {
      name: 'jst_template_health_idx',
      fields: ['projectId', 'healthStatus'],
    },
    {
      name: 'jst_template_commit_idx',
      fields: ['compiledCommitId'],
    },
    {
      name: 'jst_template_code_idx',
      fields: ['runtimeCodeHash'],
    },
    {
      name: 'jst_template_artifact_idx',
      fields: ['artifactHash'],
    },
    {
      name: 'jst_template_input_idx',
      fields: ['compiledInputKey'],
    },
  ],
  fields: [
    {
      type: 'uid',
      name: 'id',
      prefix: 'jtt_',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'projectId',
      length: 64,
      allowNull: false,
    },
    {
      type: 'belongsTo',
      name: 'project',
      target: JS_TEMPLATE_COLLECTIONS.projects,
      targetKey: 'id',
      foreignKey: 'projectId',
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
      name: 'templateName',
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
    {
      type: 'json',
      name: 'diagnostics',
    },
  ],
});
