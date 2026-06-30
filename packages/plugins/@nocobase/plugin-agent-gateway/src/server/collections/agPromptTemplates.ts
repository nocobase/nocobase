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
  name: 'agPromptTemplates',
  tableName: 'ag_prompt_templates',
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
      type: 'text',
      name: 'templateText',
      length: 'long',
    },
    {
      type: 'jsonb',
      name: 'variablesSchemaJson',
    },
    {
      type: 'jsonb',
      name: 'defaultExecutionPayloadJson',
    },
    {
      type: 'jsonb',
      name: 'metadataJson',
    },
    {
      type: 'belongsTo',
      name: 'defaultAgentProfile',
      target: 'agAgentProfiles',
      foreignKey: 'defaultAgentProfileId',
      onDelete: 'SET NULL',
    },
  ],
});
