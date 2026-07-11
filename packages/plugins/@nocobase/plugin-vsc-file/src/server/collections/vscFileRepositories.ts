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
  name: 'vscFileRepositories',
  autoGenId: false,
  indexes: [
    {
      unique: true,
      fields: ['ownerType', 'ownerId', 'name'],
    },
    {
      fields: ['ownerType', 'ownerId'],
    },
    {
      fields: ['headCommitId'],
    },
    {
      fields: ['status'],
    },
  ],
  fields: [
    {
      type: 'uid',
      name: 'id',
      prefix: 'vscr_',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'ownerType',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'ownerId',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'name',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'status',
      allowNull: false,
      defaultValue: 'active',
    },
    {
      type: 'string',
      name: 'defaultRef',
      allowNull: false,
      defaultValue: 'head',
    },
    {
      type: 'string',
      name: 'headCommitId',
      allowNull: true,
    },
    {
      type: 'integer',
      name: 'headSeq',
      allowNull: false,
      defaultValue: 0,
    },
  ],
});
