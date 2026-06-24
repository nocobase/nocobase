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
  name: 'vscFileDrafts',
  autoGenId: false,
  indexes: [
    {
      fields: ['repoId', 'baseCommitId'],
    },
    {
      fields: ['userId'],
    },
    {
      fields: ['status'],
    },
  ],
  fields: [
    {
      type: 'uid',
      name: 'id',
      prefix: 'vscd_',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'repoId',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'userId',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'baseCommitId',
      allowNull: true,
    },
    {
      type: 'string',
      name: 'status',
      allowNull: false,
      defaultValue: 'active',
    },
    {
      type: 'string',
      name: 'activeKey',
      allowNull: true,
      unique: true,
    },
  ],
});
