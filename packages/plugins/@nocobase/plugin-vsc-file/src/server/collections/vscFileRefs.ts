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
      unique: true,
      fields: ['repoId', 'name'],
    },
    {
      fields: ['commitId'],
    },
    {
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
      allowNull: false,
    },
    {
      type: 'string',
      name: 'name',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'type',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'commitId',
      allowNull: true,
    },
  ],
});
