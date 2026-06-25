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
  name: 'vscFileDraftFiles',
  autoGenId: false,
  indexes: [
    {
      unique: true,
      fields: ['draftId', 'pathHash'],
    },
    {
      fields: ['draftId'],
    },
    {
      fields: ['blobHash'],
    },
  ],
  fields: [
    {
      type: 'uid',
      name: 'id',
      prefix: 'vscdf_',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'draftId',
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
      name: 'operation',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'blobHash',
      length: 64,
      allowNull: true,
    },
    {
      type: 'string',
      name: 'language',
      length: 64,
      allowNull: true,
    },
    {
      type: 'string',
      name: 'mode',
      length: 16,
      allowNull: true,
    },
  ],
});
