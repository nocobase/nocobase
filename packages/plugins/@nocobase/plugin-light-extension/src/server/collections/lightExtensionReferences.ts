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
  name: 'lightExtensionReferences',
  dataCategory: 'system',
  autoGenId: false,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['ownerLocatorHash', 'repoId', 'entryId'],
    },
    {
      fields: ['repoId', 'entryId', 'resolvedStatus'],
    },
    {
      fields: ['publicationId'],
    },
    {
      fields: ['ownerKind'],
    },
  ],
  fields: [
    {
      type: 'uid',
      name: 'id',
      prefix: 'lef_',
      primaryKey: true,
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
      onDelete: 'RESTRICT',
    },
    {
      type: 'string',
      name: 'entryId',
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
      name: 'publicationId',
    },
    {
      type: 'belongsTo',
      name: 'publication',
      target: 'lightExtensionEntryPublications',
      targetKey: 'id',
      foreignKey: 'publicationId',
      constraints: false,
    },
    {
      type: 'string',
      name: 'ownerKind',
      allowNull: false,
      defaultValue: 'flowModel.step',
    },
    {
      type: 'json',
      name: 'ownerLocator',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'ownerLocatorHash',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'versionPolicy',
      allowNull: false,
      defaultValue: 'pinned',
    },
    {
      type: 'string',
      name: 'resolvedStatus',
      allowNull: false,
      defaultValue: 'no_active_publication',
    },
  ],
});
