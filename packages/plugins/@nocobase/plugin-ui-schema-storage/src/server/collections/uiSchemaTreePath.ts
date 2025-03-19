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
  name: 'uiSchemaTreePath',
  autoGenId: false,
  timestamps: false,
  indexes: [
    {
      fields: ['descendant'],
    },
  ],
  fields: [
    {
      type: 'string',
      name: 'ancestor',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'descendant',
      primaryKey: true,
      index: true,
    },
    {
      type: 'integer',
      name: 'depth',
    },
    {
      type: 'boolean',
      name: 'async',
    },
    {
      type: 'string',
      name: 'type',
      comment: 'type of node',
    },
    {
      type: 'integer',
      name: 'sort',
      comment: 'sort of node in adjacency',
    },
  ],
} as CollectionOptions;
