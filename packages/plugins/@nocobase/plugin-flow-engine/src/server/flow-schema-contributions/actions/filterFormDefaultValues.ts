/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowActionSchemaContribution } from '../../flow-schema-registry';

export const filterFormDefaultValuesSchemaContribution: FlowActionSchemaContribution = {
  name: 'filterFormDefaultValues',
  title: 'Filter form default values',
  source: 'official',
  strict: false,
  paramsSchema: {
    type: 'object',
    properties: {
      value: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            enable: { type: 'boolean' },
            mode: { type: 'string' },
            field: { type: 'string' },
            targetPath: { type: 'string' },
            value: {},
          },
          additionalProperties: true,
        },
      },
    },
    additionalProperties: false,
  },
  docs: {
    minimalExample: {
      value: [],
    },
    dynamicHints: [
      {
        kind: 'custom-component',
        path: 'actions.filterFormDefaultValues.value',
        message: 'Default value rules depend on filter-form field models, operators, and collection metadata.',
        'x-flow': {
          contextRequirements: ['filter form field tree', 'collection metadata', 'filter operators'],
          unresolvedReason: 'runtime-filter-form-default-values',
          recommendedFallback: {
            value: [],
          },
        },
      },
    ],
  },
};
