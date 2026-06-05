/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection, CollectionOptions } from '@nocobase/database';

export default defineCollection({
  migrationRules: ['schema-only'],
  autoGenId: false,
  name: 'aiToolMessages',
  fields: [
    {
      name: 'id',
      type: 'bigInt',
      primaryKey: true,
    },
    {
      name: 'sessionId',
      type: 'uuid',
    },
    {
      name: 'messageId',
      type: 'bigInt',
    },
    {
      name: 'toolCallId',
      type: 'string',
      index: { unique: true },
    },
    {
      name: 'toolName',
      type: 'string',
    },
    {
      name: 'status',
      type: 'string',
      allowNull: true,
    },
    {
      name: 'content',
      type: 'jsonb',
      allowNull: true,
    },
    {
      name: 'invokeStatus',
      type: 'string',
    },
    {
      name: 'invokeStartTime',
      type: 'unixTimestamp',
      accuracy: 'millisecond',
      allowNull: true,
    },
    {
      name: 'invokeEndTime',
      type: 'unixTimestamp',
      accuracy: 'millisecond',
      allowNull: true,
    },
    {
      name: 'auto',
      type: 'boolean',
    },
    {
      name: 'execution',
      type: 'string',
      allowNull: true,
    },
    {
      name: 'interruptActionOrder',
      type: 'integer',
      allowNull: true,
    },
    {
      name: 'interruptAction',
      type: 'jsonb',
      allowNull: true,
    },
    {
      name: 'userDecision',
      type: 'jsonb',
      allowNull: true,
    },
  ],
});
