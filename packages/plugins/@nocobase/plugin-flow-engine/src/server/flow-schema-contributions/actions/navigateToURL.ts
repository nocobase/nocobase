/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowActionSchemaContribution } from '../../flow-schema-registry';

const searchParamSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    value: { type: 'string' },
  },
  additionalProperties: false,
} as const;

const navigateToURLValueSchema = {
  type: 'object',
  properties: {
    url: { type: 'string' },
    searchParams: {
      type: 'array',
      items: searchParamSchema as any,
    },
    openInNewWindow: { type: 'boolean' },
  },
  additionalProperties: false,
} as const;

export const navigateToURLSchemaContribution: FlowActionSchemaContribution = {
  name: 'navigateToURL',
  title: 'Navigate to URL',
  source: 'official',
  strict: false,
  paramsSchema: {
    type: 'object',
    properties: {
      value: navigateToURLValueSchema as any,
    },
    additionalProperties: false,
  },
  docs: {
    minimalExample: {
      value: {
        url: '/admin/users',
        searchParams: [
          {
            name: 'status',
            value: 'active',
          },
        ],
        openInNewWindow: false,
      },
    },
  },
};
