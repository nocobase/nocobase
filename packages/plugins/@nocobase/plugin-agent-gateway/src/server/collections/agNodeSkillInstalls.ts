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
  name: 'agNodeSkillInstalls',
  tableName: 'ag_node_skill_installs',
  dataCategory: 'business',
  migrationRules: ['schema-only'],
  autoGenId: false,
  indexes: [
    {
      unique: true,
      fields: ['nodeId', 'skillVersionId'],
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
      type: 'uuid',
      name: 'skillVersionId',
      autoFill: false,
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
      type: 'belongsTo',
      name: 'skillVersion',
      target: 'agSkillVersions',
      foreignKey: 'skillVersionId',
      onDelete: 'CASCADE',
    },
    {
      type: 'string',
      name: 'status',
      defaultValue: 'installed',
      index: true,
    },
    {
      type: 'date',
      name: 'installedAt',
    },
    {
      type: 'date',
      name: 'lastSeenAt',
    },
    {
      type: 'jsonb',
      name: 'capabilitiesSnapshotJson',
    },
    {
      type: 'jsonb',
      name: 'settingsSnapshotJson',
    },
  ],
});
