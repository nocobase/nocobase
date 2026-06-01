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
  name: 'uiLayouts',
  dumpRules: 'required',
  migrationRules: ['overwrite', 'schema-only'],
  hidden: false,
  autoGenId: false,
  timestamps: false,
  fields: [
    {
      name: 'id',
      type: 'snowflakeId',
      primaryKey: true,
      allowNull: false,
      interface: 'id',
    },
    {
      name: 'uid',
      type: 'string',
      unique: true,
      allowNull: false,
    },
    {
      name: 'routeName',
      type: 'string',
      unique: true,
      allowNull: false,
    },
    {
      name: 'routePath',
      type: 'string',
      allowNull: false,
    },
    {
      name: 'authCheck',
      type: 'boolean',
      defaultValue: true,
      allowNull: false,
    },
    {
      name: 'enabled',
      type: 'boolean',
      defaultValue: true,
      allowNull: false,
    },
  ],
  filterTargetKey: 'id',
});
