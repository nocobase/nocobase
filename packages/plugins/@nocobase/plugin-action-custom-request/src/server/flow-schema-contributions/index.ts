/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowActionSchemaContribution, FlowSchemaContribution } from '@nocobase/flow-engine';

const requestNameValueSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    value: { type: 'string' },
  },
  additionalProperties: false,
} as const;

export const customRequestActionSchemaContribution: FlowActionSchemaContribution = {
  name: 'customRequest',
  title: 'Custom request',
  source: 'plugin',
  strict: false,
  paramsSchema: {
    type: 'object',
    properties: {
      key: { type: 'string' },
      method: {
        type: 'string',
        enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      },
      url: { type: 'string' },
      headers: {
        type: 'array',
        items: requestNameValueSchema as any,
      },
      params: {
        type: 'array',
        items: requestNameValueSchema as any,
      },
      data: {},
      timeout: { type: 'number' },
      responseType: {
        type: 'string',
        enum: ['json', 'stream'],
      },
      variablePaths: {
        type: 'array',
        items: { type: 'string' },
      },
      roles: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    additionalProperties: false,
  },
  docs: {
    minimalExample: {
      key: 'req_demo',
      method: 'POST',
      url: 'https://api.example.com/orders',
      headers: [
        {
          name: 'Authorization',
          value: 'Bearer {{ctx.token}}',
        },
      ],
      params: [
        {
          name: 'id',
          value: '{{ctx.record.id}}',
        },
      ],
      data: {
        status: 'processed',
      },
      timeout: 5000,
      responseType: 'json',
    },
  },
};

export const flowSchemaContribution: FlowSchemaContribution = {
  actions: [customRequestActionSchemaContribution],
  defaults: {
    source: 'plugin',
  },
};
