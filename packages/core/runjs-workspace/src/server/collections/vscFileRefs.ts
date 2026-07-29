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
  name: 'vscFileRefs',
  autoGenId: false,
  indexes: [
    {
      name: 'vscref_repo_name_uq',
      unique: true,
      fields: ['repoId', 'name'],
    },
    {
      name: 'vscref_commit_idx',
      fields: ['commitId'],
    },
    {
      name: 'vscref_type_idx',
      fields: ['type'],
    },
  ],
  fields: [
    {
      type: 'uid',
      name: 'id',
      prefix: 'vscref_',
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
      name: 'name',
      length: 255,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'type',
      length: 32,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'commitId',
      length: 64,
      allowNull: true,
    },
  ],
});
