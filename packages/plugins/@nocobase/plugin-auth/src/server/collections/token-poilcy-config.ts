/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';

import { tokenPolicyCollectionName } from '../../constants';

export default defineCollection({
  name: tokenPolicyCollectionName,
  migrationRules: ['overwrite', 'schema-only'],
  autoGenId: false,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
  fields: [
    {
      name: 'key',
      type: 'string',
      primaryKey: true,
      allowNull: false,
      interface: 'input',
    },
    {
      type: 'json',
      name: 'config',
      allowNull: false,
      defaultValue: {},
    },
  ],
});
