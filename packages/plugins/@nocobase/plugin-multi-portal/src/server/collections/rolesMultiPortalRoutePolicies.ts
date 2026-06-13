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
  name: 'rolesMultiPortalRoutePolicies',
  dumpRules: 'required',
  migrationRules: ['overwrite', 'schema-only'],
  autoGenId: false,
  indexes: [
    {
      unique: true,
      fields: ['roleName', 'multiPortalUid'],
    },
  ],
  fields: [
    {
      name: 'id',
      type: 'snowflakeId',
      primaryKey: true,
      allowNull: false,
    },
    {
      type: 'belongsTo',
      name: 'role',
      target: 'roles',
      targetKey: 'name',
      foreignKey: 'roleName',
      onDelete: 'CASCADE',
    },
    {
      type: 'belongsTo',
      name: 'multiPortal',
      target: 'multiPortals',
      targetKey: 'uid',
      foreignKey: 'multiPortalUid',
      onDelete: 'CASCADE',
    },
    {
      type: 'boolean',
      name: 'allowNewMenu',
      defaultValue: false,
    },
  ],
});
