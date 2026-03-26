/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution } from '@nocobase/flow-engine';
import { filterFormCollapseSettingsStepParamsSchema, linkageRuleValueSchema } from '../shared';

export const filterFormCollapseActionModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'FilterFormCollapseActionModel',
  title: 'Filter form collapse action',
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
      collapseSettings: filterFormCollapseSettingsStepParamsSchema,
    },
    additionalProperties: true,
  },
  skeleton: {
    uid: 'todo-filter-collapse-action-uid',
    use: 'FilterFormCollapseActionModel',
    stepParams: {
      buttonSettings: {
        general: {
          type: 'link',
        },
      },
      collapseSettings: {
        toggle: {
          collapsedRows: 1,
        },
        defaultCollapsed: {
          value: false,
        },
      },
    },
  },
};
