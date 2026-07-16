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
  name: 'vscFileConflicts',
  autoGenId: false,
  indexes: [
    {
      fields: ['remoteId', 'remoteTargetVersion', 'status'],
    },
    {
      fields: ['remoteId', 'remoteTargetVersion', 'createdAt'],
    },
  ],
  fields: [
    {
      type: 'uid',
      name: 'id',
      prefix: 'vsccf_',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'remoteId',
      allowNull: false,
    },
    {
      type: 'belongsTo',
      name: 'remote',
      target: 'vscFileRemotes',
      targetKey: 'id',
      foreignKey: 'remoteId',
      constraints: true,
      onDelete: 'CASCADE',
    },
    {
      type: 'integer',
      name: 'remoteTargetVersion',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'status',
      allowNull: false,
      defaultValue: 'open',
    },
    {
      type: 'string',
      name: 'baseLocalCommitId',
      allowNull: true,
    },
    {
      type: 'string',
      name: 'baseRemoteRevision',
      allowNull: true,
    },
    {
      type: 'string',
      name: 'currentLocalCommitId',
      allowNull: true,
    },
    {
      type: 'string',
      name: 'currentRemoteRevision',
      allowNull: true,
    },
    {
      type: 'string',
      name: 'localContentHash',
      length: 128,
      allowNull: true,
    },
    {
      type: 'string',
      name: 'remoteContentHash',
      length: 128,
      allowNull: true,
    },
    {
      type: 'string',
      name: 'reasonCode',
      allowNull: false,
    },
    {
      type: 'date',
      name: 'resolvedAt',
      allowNull: true,
    },
  ],
});
