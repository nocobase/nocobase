/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution } from '@nocobase/flow-engine';

export const filterFormCustomFieldModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'FilterFormCustomFieldModel',
  title: 'Filter form custom field item',
  source: 'official',
  strict: false,
  exposure: 'internal',
  suggestedUses: ['FilterFormBlockModel'],
  stepParamsSchema: {
    type: 'object',
    properties: {
      formItemSettings: {
        type: 'object',
        properties: {
          fieldSettings: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              name: { type: 'string' },
              source: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              fieldModel: { type: 'string' },
              operator: { type: 'string' },
              fieldModelProps: {
                type: 'object',
                additionalProperties: true,
              },
            },
            required: ['title', 'name'],
            additionalProperties: true,
          },
        },
        additionalProperties: true,
      },
    },
    additionalProperties: true,
  },
  docs: {
    dynamicHints: [
      {
        kind: 'dynamic-ui-schema',
        path: 'FilterFormCustomFieldModel.stepParams.formItemSettings.fieldSettings',
        message: 'Custom filter field settings depend on runtime field-model registries and operator metadata.',
        'x-flow': {
          contextRequirements: ['field model registry', 'custom operator registry'],
          unresolvedReason: 'runtime-filter-form-custom-field-settings',
        },
      },
    ],
  },
};
