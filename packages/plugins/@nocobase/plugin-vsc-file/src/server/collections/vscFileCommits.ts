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
  name: 'vscFileCommits',
  autoGenId: false,
  indexes: [
    {
      unique: true,
      fields: ['repoId', 'seq'],
    },
    {
      unique: true,
      fields: ['repoId', 'hash'],
    },
    {
      fields: ['repoId', 'createdAt'],
    },
    {
      fields: ['repoId', 'parentCommitId'],
    },
    {
      fields: ['treeHash'],
    },
  ],
  fields: [
    {
      type: 'uid',
      name: 'id',
      prefix: 'vscc_',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'repoId',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'hash',
      length: 64,
      allowNull: false,
    },
    {
      type: 'integer',
      name: 'seq',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'parentCommitId',
      allowNull: true,
    },
    {
      type: 'string',
      name: 'treeHash',
      length: 64,
      allowNull: false,
    },
    {
      type: 'text',
      name: 'message',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'authorId',
      allowNull: true,
    },
    {
      type: 'json',
      name: 'metadata',
      defaultValue: {},
    },
  ],
});
