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
  name: 'vscFileRemotes',
  autoGenId: false,
  indexes: [
    {
      unique: true,
      fields: ['repoId', 'name'],
    },
    {
      fields: ['repoId', 'status'],
    },
    {
      fields: ['provider'],
    },
  ],
  fields: [
    {
      type: 'uid',
      name: 'id',
      prefix: 'vscrmt_',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'repoId',
      allowNull: false,
    },
    {
      type: 'belongsTo',
      name: 'repository',
      target: 'vscFileRepositories',
      targetKey: 'id',
      foreignKey: 'repoId',
      constraints: true,
      onDelete: 'CASCADE',
    },
    {
      type: 'string',
      name: 'name',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'provider',
      allowNull: false,
    },
    {
      type: 'json',
      name: 'config',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'authRef',
      allowNull: true,
    },
    {
      type: 'string',
      name: 'status',
      allowNull: false,
      defaultValue: 'active',
    },
    {
      type: 'integer',
      name: 'version',
      allowNull: false,
      defaultValue: 1,
    },
    {
      type: 'date',
      name: 'lastCheckedAt',
      allowNull: true,
    },
    {
      type: 'date',
      name: 'lastSyncedAt',
      allowNull: true,
    },
    {
      type: 'string',
      name: 'lastErrorCode',
      allowNull: true,
    },
  ],
});
