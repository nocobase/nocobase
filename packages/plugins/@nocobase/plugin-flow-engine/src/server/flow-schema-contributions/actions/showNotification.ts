/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowActionSchemaContribution } from '@nocobase/flow-engine';

const showNotificationValueSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['success', 'error', 'info', 'warning'],
    },
    title: { type: 'string' },
    description: { type: 'string' },
    duration: { type: ['number', 'null'] as any },
    placement: {
      type: 'string',
      enum: ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'],
    },
  },
  additionalProperties: false,
} as const;

export const showNotificationSchemaContribution: FlowActionSchemaContribution = {
  name: 'showNotification',
  title: 'Show notification',
  source: 'official',
  strict: false,
  paramsSchema: {
    type: 'object',
    properties: {
      value: showNotificationValueSchema as any,
    },
    additionalProperties: false,
  },
  docs: {
    minimalExample: {
      value: {
        type: 'info',
        title: 'Sync completed',
        description: 'The target blocks were refreshed.',
        duration: 5,
        placement: 'topRight',
      },
    },
  },
};
