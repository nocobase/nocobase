/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionOptions } from '@nocobase/database';

export default {
  dumpRules: 'required',
  migrationRules: ['overwrite', 'schema-only'],
  name: 'flowModelTemplateUsages',
  autoGenId: false,
  timestamps: true,
  fields: [
    {
      type: 'uid',
      name: 'uid',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'templateUid',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'modelUid',
      allowNull: false,
    },
  ],
  indexes: [
    {
      fields: ['uid'],
      unique: true,
    },
    {
      fields: ['templateUid', 'modelUid'],
      unique: true,
    },
    {
      fields: ['templateUid'],
    },
    {
      fields: ['modelUid'],
    },
  ],
} as CollectionOptions;
