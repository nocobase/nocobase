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
  name: 'rolesResources',
  migrationRules: ['overwrite', 'schema-only'],
  model: 'RoleResourceModel',
  indexes: [
    {
      unique: true,
      fields: ['roleName', 'name'],
    },
  ],
  fields: [
    {
      type: 'belongsTo',
      name: 'role',
      foreignKey: 'roleName',
      targetKey: 'name',
    },
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'boolean',
      name: 'usingActionsConfig',
    },
    {
      type: 'hasMany',
      name: 'actions',
      target: 'rolesResourcesActions',
    },
  ],
});
