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
  name: 'vscFileExternalCommitMaps',
  autoGenId: false,
  updatedAt: false,
  indexes: [
    {
      name: 'vscmap_local_uq',
      unique: true,
      fields: ['remoteId', 'remoteTargetVersion', 'localCommitId'],
    },
    {
      name: 'vscmap_remote_uq',
      unique: true,
      fields: ['remoteId', 'remoteTargetVersion', 'remoteRevision'],
    },
    {
      name: 'vscmap_created_idx',
      fields: ['remoteId', 'remoteTargetVersion', 'createdAt'],
    },
  ],
  fields: [
    {
      type: 'uid',
      name: 'id',
      prefix: 'vscmap_',
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
      name: 'localCommitId',
      length: 64,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'remoteRevision',
      length: 255,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'contentHash',
      length: 128,
      allowNull: false,
    },
  ],
});
