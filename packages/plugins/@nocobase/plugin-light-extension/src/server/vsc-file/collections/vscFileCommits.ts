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
      name: 'vscc_repo_seq_uq',
      unique: true,
      fields: ['repoId', 'seq'],
    },
    {
      name: 'vscc_repo_hash_uq',
      unique: true,
      fields: ['repoId', 'hash'],
    },
    {
      name: 'vscc_created_idx',
      fields: ['repoId', 'createdAt'],
    },
    {
      name: 'vscc_parent_idx',
      fields: ['repoId', 'parentCommitId'],
    },
    {
      name: 'vscc_tree_idx',
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
      length: 64,
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
      length: 64,
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
