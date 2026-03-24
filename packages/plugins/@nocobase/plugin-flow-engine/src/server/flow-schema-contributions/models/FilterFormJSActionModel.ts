/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution } from '@nocobase/flow-engine';
import { linkageRuleValueSchema } from '../shared';

export const filterFormJsActionModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'FilterFormJSActionModel',
  title: 'Filter form JS action',
  source: 'official',
  strict: false,
  exposure: 'internal',
  suggestedUses: ['FilterFormBlockModel'],
  stepParamsSchema: {
    type: 'object',
    properties: {
      buttonSettings: {
        type: 'object',
        properties: {
          general: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              type: { type: 'string' },
            },
            additionalProperties: true,
          },
          linkageRules: linkageRuleValueSchema,
        },
        additionalProperties: true,
      },
      clickSettings: {
        type: 'object',
        properties: {
          runJs: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              version: { type: 'string' },
            },
            additionalProperties: true,
          },
        },
        additionalProperties: true,
      },
    },
    additionalProperties: true,
  },
  skeleton: {
    uid: 'todo-filter-js-action-uid',
    use: 'FilterFormJSActionModel',
    stepParams: {
      clickSettings: {
        runJs: {
          version: 'v2',
          code: '',
        },
      },
    },
  },
  docs: {
    dynamicHints: [
      {
        kind: 'dynamic-ui-schema',
        path: 'FilterFormJSActionModel.stepParams.clickSettings.runJs',
        message: 'Filter form JS action runs inside the runtime form and collection context.',
        'x-flow': {
          contextRequirements: ['filter form context', 'runjs runtime'],
          unresolvedReason: 'runtime-filter-form-js-action',
          recommendedFallback: {
            version: 'v2',
            code: '',
          },
        },
      },
    ],
  },
};
