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
  dumpRules: {
    group: 'log',
  },
  migrationRules: ['schema-only', 'skip'],
  name: 'lightExtensionLogs',
  createdBy: false,
  updatedBy: false,
  updatedAt: false,
  indexes: [
    {
      fields: ['repoId', 'createdAt'],
    },
    {
      fields: ['entryId', 'createdAt'],
    },
    {
      fields: ['requestId'],
    },
    {
      fields: ['action', 'createdAt'],
    },
    {
      fields: ['repoId', 'action', 'createdAt'],
    },
    {
      fields: ['rawResourceAction'],
    },
  ],
  fields: [
    {
      type: 'uid',
      name: 'id',
      prefix: 'lel_',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'repoId',
    },
    {
      type: 'string',
      name: 'entryId',
    },
    {
      type: 'string',
      name: 'level',
      allowNull: false,
      defaultValue: 'info',
    },
    {
      type: 'string',
      name: 'target',
    },
    {
      type: 'string',
      name: 'kind',
    },
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'string',
      name: 'action',
    },
    {
      type: 'string',
      name: 'result',
    },
    {
      type: 'string',
      name: 'requestId',
    },
    {
      type: 'string',
      name: 'actorUserId',
    },
    {
      type: 'string',
      name: 'rawResource',
    },
    {
      type: 'string',
      name: 'rawResourceAction',
    },
    {
      type: 'string',
      name: 'denyReason',
    },
    {
      type: 'string',
      name: 'reasonCode',
    },
    {
      type: 'text',
      name: 'message',
    },
    {
      type: 'json',
      name: 'details',
    },
    {
      type: 'date',
      name: 'createdAt',
    },
  ],
});
