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
  name: 'lightExtensionClientApps',
  dataCategory: 'system',
  autoGenId: false,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['repoId', 'key'],
    },
    {
      unique: true,
      fields: ['assetSetId'],
    },
  ],
  fields: [
    {
      type: 'string',
      name: 'id',
      primaryKey: true,
      allowNull: false,
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
      constraints: true,
      onDelete: 'CASCADE',
    },
    { type: 'string', name: 'key', allowNull: false },
    { type: 'string', name: 'title', allowNull: false },
    {
      type: 'string',
      name: 'entryHtml',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'assetSetId',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'contentHash',
      allowNull: false,
    },
    {
      type: 'integer',
      name: 'fileCount',
      allowNull: false,
    },
    {
      type: 'bigInt',
      name: 'byteSize',
      allowNull: false,
    },
  ],
});
