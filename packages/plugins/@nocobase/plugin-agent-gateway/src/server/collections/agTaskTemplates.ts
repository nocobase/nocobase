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
  name: 'agTaskTemplates',
  tableName: 'ag_task_templates',
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
      type: 'string',
      name: 'templateKey',
      unique: true,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'displayName',
    },
    {
      type: 'text',
      name: 'description',
    },
    {
      type: 'string',
      name: 'status',
      defaultValue: 'active',
      index: true,
    },
    {
      type: 'integer',
      name: 'sort',
      defaultValue: 0,
    },
    {
      type: 'string',
      name: 'defaultTitle',
    },
    {
      type: 'text',
      name: 'defaultPrompt',
      length: 'long',
    },
    {
      type: 'string',
      name: 'cwd',
    },
    {
      type: 'string',
      name: 'artifactRoot',
    },
    {
      type: 'jsonb',
      name: 'skillVersionIdsJson',
    },
    {
      type: 'jsonb',
      name: 'artifactsJson',
    },
    {
      type: 'jsonb',
      name: 'metadataJson',
    },
    {
      type: 'belongsTo',
      name: 'node',
      target: 'agNodes',
      foreignKey: 'nodeId',
      onDelete: 'SET NULL',
    },
    {
      type: 'belongsTo',
      name: 'agentProfile',
      target: 'agAgentProfiles',
      foreignKey: 'agentProfileId',
      onDelete: 'SET NULL',
    },
  ],
});
