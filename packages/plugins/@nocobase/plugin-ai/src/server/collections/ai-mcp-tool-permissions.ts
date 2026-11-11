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
  name: 'aiMcpToolPermissions',
  migrationRules: ['overwrite', 'schema-only'],
  fields: [
    // The column-level cascade also covers bulk/model deletes that bypass individual relation hooks.
    { name: 'serverName', type: 'string', allowNull: false, onDelete: 'CASCADE' },
    { name: 'toolName', type: 'string', allowNull: false },
    { name: 'permission', type: 'string', allowNull: false, validate: { isIn: [['ASK', 'ALLOW']] } },
    // Relation setup refreshes indexes, so declare the indexed columns before this association.
    {
      name: 'server',
      type: 'belongsTo',
      target: 'aiMcpClients',
      targetKey: 'name',
      foreignKey: 'serverName',
      constraints: true,
      onDelete: 'CASCADE',
    },
  ],
  indexes: [{ fields: ['serverName', 'toolName'], unique: true }],
});
