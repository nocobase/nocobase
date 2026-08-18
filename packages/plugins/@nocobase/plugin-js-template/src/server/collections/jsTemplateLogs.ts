/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';

import { JS_TEMPLATE_COLLECTIONS } from '../../constants';

export default defineCollection({
  dumpRules: {
    group: 'log',
  },
  migrationRules: ['schema-only', 'skip'],
  name: JS_TEMPLATE_COLLECTIONS.logs,
  createdBy: false,
  updatedBy: false,
  updatedAt: false,
  indexes: [
    {
      name: 'jst_log_project_idx',
      fields: ['projectId', 'createdAt'],
    },
    {
      name: 'jst_log_template_idx',
      fields: ['templateId', 'createdAt'],
    },
    {
      name: 'jst_log_request_idx',
      fields: ['requestId'],
    },
    {
      name: 'jst_log_action_idx',
      fields: ['action', 'createdAt'],
    },
    {
      name: 'jst_log_project_action_idx',
      fields: ['projectId', 'action', 'createdAt'],
    },
    {
      name: 'jst_log_resource_idx',
      fields: ['rawResourceAction'],
    },
  ],
  fields: [
    {
      type: 'uid',
      name: 'id',
      prefix: 'jtl_',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'projectId',
    },
    {
      type: 'string',
      name: 'templateId',
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
