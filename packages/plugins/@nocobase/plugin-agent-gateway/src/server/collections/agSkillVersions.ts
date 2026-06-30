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
  name: 'agSkillVersions',
  tableName: 'ag_skill_versions',
  dataCategory: 'business',
  migrationRules: ['schema-only'],
  autoGenId: false,
  indexes: [
    {
      unique: true,
      fields: ['skillId', 'versionLabel'],
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
      name: 'skillId',
      autoFill: false,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'versionLabel',
      allowNull: false,
    },
    {
      type: 'belongsTo',
      name: 'skill',
      target: 'agSkills',
      foreignKey: 'skillId',
      onDelete: 'CASCADE',
    },
    {
      type: 'string',
      name: 'status',
      defaultValue: 'active',
      index: true,
    },
    {
      type: 'jsonb',
      name: 'manifestJson',
    },
    {
      type: 'jsonb',
      name: 'inputSchemaJson',
    },
    {
      type: 'jsonb',
      name: 'outputSchemaJson',
    },
    {
      type: 'jsonb',
      name: 'metadataJson',
    },
  ],
});
