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
  name: 'agTerminalStreamTickets',
  tableName: 'ag_terminal_stream_tickets',
  dataCategory: 'system',
  migrationRules: ['schema-only'],
  autoGenId: false,
  indexes: [
    {
      unique: true,
      fields: ['ticketHash'],
    },
    {
      fields: ['runId', 'expiresAt'],
    },
    {
      fields: ['userId', 'expiresAt'],
    },
  ],
  fields: [
    {
      type: 'uuid',
      name: 'id',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'ticketHash',
      allowNull: false,
      unique: true,
      hidden: true,
    },
    {
      type: 'string',
      name: 'ticketLast4',
    },
    {
      type: 'uuid',
      name: 'runId',
      autoFill: false,
      allowNull: false,
      index: true,
    },
    {
      type: 'belongsTo',
      name: 'run',
      target: 'agRuns',
      foreignKey: 'runId',
      onDelete: 'CASCADE',
    },
    {
      type: 'bigInt',
      name: 'userId',
      allowNull: false,
      index: true,
    },
    {
      type: 'belongsTo',
      name: 'user',
      target: 'users',
      foreignKey: 'userId',
      onDelete: 'CASCADE',
    },
    {
      type: 'string',
      name: 'authenticator',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'currentRole',
      allowNull: false,
    },
    {
      type: 'jsonb',
      name: 'currentRoles',
      allowNull: false,
      defaultValue: [],
    },
    {
      type: 'date',
      name: 'expiresAt',
      allowNull: false,
      index: true,
    },
    {
      type: 'date',
      name: 'usedAt',
    },
  ],
});
