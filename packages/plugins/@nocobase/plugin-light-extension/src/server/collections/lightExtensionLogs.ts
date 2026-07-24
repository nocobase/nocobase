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
      name: 'le_log_repo_idx',
      fields: ['repoId', 'createdAt'],
    },
    {
      name: 'le_log_entry_idx',
      fields: ['entryId', 'createdAt'],
    },
    {
      name: 'le_log_request_idx',
      fields: ['requestId'],
    },
    {
      name: 'le_log_action_idx',
      fields: ['action', 'createdAt'],
    },
    {
      name: 'le_log_repo_action_idx',
      fields: ['repoId', 'action', 'createdAt'],
    },
    {
      name: 'le_log_resource_idx',
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
