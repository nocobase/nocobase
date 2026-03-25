/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowActionSchemaContribution } from '@nocobase/flow-engine';

const showMessageValueSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['success', 'error', 'info', 'warning', 'loading'],
    },
    content: { type: 'string' },
    duration: { type: ['number', 'null'] as any },
  },
  additionalProperties: false,
} as const;

export const showMessageSchemaContribution: FlowActionSchemaContribution = {
  name: 'showMessage',
  title: 'Show message',
  source: 'official',
  strict: false,
  paramsSchema: {
    type: 'object',
    properties: {
      value: showMessageValueSchema as any,
    },
    additionalProperties: false,
  },
  docs: {
    minimalExample: {
      value: {
        type: 'info',
        content: 'Saved successfully',
        duration: 3,
      },
    },
  },
};
