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
  name: 'multiPortals',
  dumpRules: 'required',
  migrationRules: ['overwrite', 'schema-only'],
  autoGenId: false,
  timestamps: true,
  indexes: [
    {
      type: 'UNIQUE',
      fields: ['routeName'],
    },
    {
      type: 'UNIQUE',
      fields: ['isDefault'],
    },
  ],
  fields: [
    {
      name: 'uid',
      type: 'string',
      unique: true,
      primaryKey: true,
      allowNull: false,
    },
    {
      name: 'title',
      type: 'string',
      defaultValue: 'Untitled',
      allowNull: false,
    },
    {
      name: 'icon',
      type: 'string',
      allowNull: true,
    },
    {
      name: 'portalType',
      type: 'string',
      allowNull: true,
    },
    {
      name: 'portalName',
      type: 'string',
      field: 'routeName',
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
    {
      name: 'isDefault',
      type: 'boolean',
      defaultValue: null,
      allowNull: true,
    },
    {
      name: 'options',
      type: 'json',
      defaultValue: {},
      allowNull: true,
    },
    {
      name: 'uiLayoutUid',
      type: 'string',
      allowNull: true,
    },
    {
      name: 'createdAt',
      type: 'date',
      field: 'createdAt',
      interface: 'createdAt',
      allowNull: true,
    },
    {
      name: 'updatedAt',
      type: 'date',
      field: 'updatedAt',
      interface: 'updatedAt',
      allowNull: true,
    },
  ],
  filterTargetKey: 'uid',
});
