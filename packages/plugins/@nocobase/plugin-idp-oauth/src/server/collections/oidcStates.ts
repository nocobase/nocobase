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
  dumpRules: 'required',
  name: 'oidcStates',
  migrationRules: ['schema-only'],
  createdAt: true,
  updatedAt: true,
  indexes: [
    {
      unique: true,
      fields: ['model', 'oidcId'],
    },
    {
      fields: ['model', 'uid'],
    },
    {
      fields: ['model', 'userCode'],
    },
    {
      fields: ['grantId'],
    },
    {
      fields: ['expiresAt'],
    },
  ],
  fields: [
    {
      type: 'string',
      name: 'model',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'oidcId',
      allowNull: false,
    },
    {
      type: 'json',
      name: 'payload',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'grantId',
    },
    {
      type: 'string',
      name: 'uid',
    },
    {
      type: 'string',
      name: 'userCode',
    },
    {
      type: 'unixTimestamp',
      name: 'expiresAt',
      accuracy: 'second',
    },
    {
      type: 'unixTimestamp',
      name: 'consumedAt',
      accuracy: 'second',
    },
  ],
});
