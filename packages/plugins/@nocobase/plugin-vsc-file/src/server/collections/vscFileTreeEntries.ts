/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';

import { maxPathLength } from '../../shared/constants';

export default defineCollection({
  name: 'vscFileTreeEntries',
  indexes: [
    {
      unique: true,
      fields: ['treeHash', 'pathHash'],
    },
    {
      unique: true,
      fields: ['treeHash', 'pathLowerHash'],
    },
    {
      fields: ['treeHash'],
    },
    {
      fields: ['blobHash'],
    },
    {
      fields: ['pathHash'],
    },
  ],
  fields: [
    {
      type: 'string',
      name: 'treeHash',
      length: 64,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'path',
      length: maxPathLength,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'pathHash',
      length: 64,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'pathLowerHash',
      length: 64,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'blobHash',
      length: 64,
      allowNull: false,
    },
    {
      type: 'integer',
      name: 'size',
      allowNull: false,
    },
  ],
});
