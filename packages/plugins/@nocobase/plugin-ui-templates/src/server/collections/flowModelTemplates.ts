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
  name: 'flowModelTemplates',
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
      name: 'name',
      allowNull: false,
    },
    {
      type: 'text',
      name: 'description',
    },
    {
      type: 'string',
      name: 'targetUid',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'useModel',
    },
    {
      type: 'string',
      name: 'type',
    },
    {
      type: 'string',
      name: 'dataSourceKey',
    },
    {
      type: 'string',
      name: 'collectionName',
    },
    {
      type: 'string',
      name: 'associationName',
    },
    {
      type: 'string',
      name: 'filterByTk',
    },
    {
      type: 'string',
      name: 'sourceId',
    },
  ],
  indexes: [
    {
      fields: ['uid'],
      unique: true,
    },
    {
      fields: ['targetUid'],
    },
  ],
} as CollectionOptions;
