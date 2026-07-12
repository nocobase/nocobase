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
  name: 'agNodeInvitations',
  tableName: 'ag_node_invitations',
  dataCategory: 'business',
  migrationRules: ['schema-only'],
  autoGenId: false,
  fields: [
    {
      type: 'uuid',
      name: 'id',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'invitationKey',
      unique: true,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'status',
      defaultValue: 'pending',
      index: true,
    },
    {
      type: 'string',
      name: 'tokenHash',
      hidden: true,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'tokenLast4',
    },
    {
      type: 'string',
      name: 'expectedNodeKey',
    },
    {
      type: 'date',
      name: 'expiresAt',
    },
    {
      type: 'date',
      name: 'acceptedAt',
    },
    {
      type: 'jsonb',
      name: 'metadataJson',
    },
    {
      type: 'belongsTo',
      name: 'node',
      target: 'agNodes',
      foreignKey: 'nodeId',
      onDelete: 'SET NULL',
    },
  ],
});
