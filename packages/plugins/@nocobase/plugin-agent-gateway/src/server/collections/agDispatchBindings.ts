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
  name: 'agDispatchBindings',
  tableName: 'ag_dispatch_bindings',
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
      name: 'bindingKey',
      unique: true,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'status',
      defaultValue: 'active',
      index: true,
    },
    {
      type: 'string',
      name: 'triggerType',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'sourceCollection',
    },
    {
      type: 'string',
      name: 'collectionName',
      index: true,
    },
    {
      type: 'string',
      name: 'sourceAction',
    },
    {
      type: 'string',
      name: 'agentProfileField',
    },
    {
      type: 'string',
      name: 'nodeField',
    },
    {
      type: 'jsonb',
      name: 'skillFieldsJson',
    },
    {
      type: 'string',
      name: 'outputAgentRunField',
    },
    {
      type: 'jsonb',
      name: 'fieldMappingsJson',
    },
    {
      type: 'boolean',
      name: 'enabled',
      defaultValue: true,
      allowNull: false,
    },
    {
      type: 'integer',
      name: 'priority',
      defaultValue: 0,
    },
    {
      type: 'jsonb',
      name: 'filterJson',
    },
    {
      type: 'jsonb',
      name: 'payloadMappingJson',
    },
    {
      type: 'jsonb',
      name: 'metadataJson',
    },
    {
      type: 'belongsTo',
      name: 'promptTemplate',
      target: 'agPromptTemplates',
      foreignKey: 'promptTemplateId',
      onDelete: 'SET NULL',
    },
    {
      type: 'belongsTo',
      name: 'agentProfile',
      target: 'agAgentProfiles',
      foreignKey: 'agentProfileId',
      onDelete: 'SET NULL',
    },
    {
      type: 'belongsTo',
      name: 'node',
      target: 'agNodes',
      foreignKey: 'nodeId',
      onDelete: 'SET NULL',
    },
  ],
});
