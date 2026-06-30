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
  name: 'agAgentProfiles',
  tableName: 'ag_agent_profiles',
  dataCategory: 'business',
  migrationRules: ['schema-only'],
  autoGenId: false,
  indexes: [
    {
      unique: true,
      fields: ['nodeId', 'profileKey'],
    },
  ],
  fields: [
    {
      type: 'uuid',
      name: 'id',
      primaryKey: true,
    },
    {
      type: 'uuid',
      name: 'nodeId',
      autoFill: false,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'profileKey',
      allowNull: false,
    },
    {
      type: 'belongsTo',
      name: 'node',
      target: 'agNodes',
      foreignKey: 'nodeId',
      onDelete: 'CASCADE',
    },
    {
      type: 'string',
      name: 'displayName',
    },
    {
      type: 'string',
      name: 'agentType',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'driver',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'status',
      defaultValue: 'active',
      index: true,
    },
    {
      type: 'jsonb',
      name: 'capabilitiesJson',
    },
    {
      type: 'jsonb',
      name: 'runtimeSnapshotJson',
    },
    {
      type: 'jsonb',
      name: 'trustedConfigJson',
      hidden: true,
    },
    {
      type: 'jsonb',
      name: 'metadataJson',
    },
  ],
});
