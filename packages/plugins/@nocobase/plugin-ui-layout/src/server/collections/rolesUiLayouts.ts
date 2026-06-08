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
  name: 'rolesUiLayouts',
  dumpRules: 'required',
  migrationRules: ['overwrite', 'schema-only'],
  autoGenId: false,
  indexes: [
    {
      unique: true,
      fields: ['roleName', 'uiLayoutUid'],
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
      name: 'uiLayout',
      target: 'uiLayouts',
      targetKey: 'uid',
      foreignKey: 'uiLayoutUid',
      onDelete: 'CASCADE',
    },
  ],
});
