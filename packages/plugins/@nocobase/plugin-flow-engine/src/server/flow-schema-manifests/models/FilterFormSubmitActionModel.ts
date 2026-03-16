/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaManifest } from '@nocobase/flow-engine';
import { linkageRuleValueSchema } from '../shared';

export const filterFormSubmitActionModelInternalSchemaManifest: FlowModelSchemaManifest = {
  use: 'FilterFormSubmitActionModel',
  title: 'Filter form submit action',
  source: 'official',
  strict: true,
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
      submitSettings: {
        type: 'object',
        properties: {
          doFilter: {
            type: 'object',
            additionalProperties: true,
          },
        },
        additionalProperties: true,
      },
    },
    additionalProperties: true,
  },
  skeleton: {
    uid: 'todo-filter-submit-action-uid',
    use: 'FilterFormSubmitActionModel',
    stepParams: {
      buttonSettings: {
        general: {
          title: 'Filter',
          type: 'primary',
        },
      },
    },
  },
};
