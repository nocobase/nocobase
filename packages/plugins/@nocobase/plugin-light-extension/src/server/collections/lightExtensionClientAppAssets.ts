/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';

import { LIGHT_EXTENSION_CLIENT_APP_STORAGE_NAME } from '../../constants';

export default defineCollection({
  name: 'lightExtensionClientAppAssets',
  dataCategory: 'system',
  template: 'file',
  storage: LIGHT_EXTENSION_CLIENT_APP_STORAGE_NAME,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['assetSetId', 'relativePath'],
    },
    {
      fields: ['entryId', 'assetSetId'],
    },
    {
      fields: ['repoId', 'assetSetId'],
    },
  ],
  fields: [
    { type: 'string', name: 'entryId' },
    { type: 'string', name: 'repoId', allowNull: false },
    { type: 'string', name: 'assetSetId', allowNull: false },
    { type: 'string', name: 'relativePath', allowNull: false },
    { type: 'string', name: 'contentHash', allowNull: false },
    { type: 'string', name: 'state', allowNull: false, defaultValue: 'staging' },
    { type: 'string', name: 'title' },
    { type: 'string', name: 'filename', allowNull: false },
    { type: 'string', name: 'extname' },
    { type: 'bigInt', name: 'size', allowNull: false },
    { type: 'string', name: 'mimetype' },
    { type: 'text', name: 'path', allowNull: false },
    { type: 'text', name: 'url' },
    { type: 'belongsTo', name: 'storage', target: 'storages', foreignKey: 'storageId' },
    { type: 'jsonb', name: 'meta', defaultValue: {} },
  ],
});
