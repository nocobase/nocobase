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
      fields: ['entryId'],
    },
    {
      unique: true,
      fields: ['assetSetId'],
    },
  ],
  fields: [
    {
      type: 'string',
      name: 'entryId',
      primaryKey: true,
      allowNull: false,
    },
    {
      type: 'belongsTo',
      name: 'entry',
      target: 'lightExtensionEntries',
      targetKey: 'id',
      foreignKey: 'entryId',
      constraints: false,
    },
    {
      type: 'string',
      name: 'entryHtml',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'staticRoot',
      allowNull: false,
      defaultValue: '',
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
