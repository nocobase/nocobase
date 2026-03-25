/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowActionSchemaContribution } from '@nocobase/flow-engine';
import { linkageRuleValueSchema } from '../shared';

export const formAssignRulesSchemaContribution: FlowActionSchemaContribution = {
  name: 'formAssignRules',
  title: 'Field values',
  source: 'official',
  strict: false,
  paramsSchema: linkageRuleValueSchema,
  docs: {
    minimalExample: {
      value: [],
    },
    dynamicHints: [
      {
        kind: 'custom-component',
        path: 'actions.formAssignRules.value',
        message: 'Assign rule items depend on the current form field tree.',
        'x-flow': {
          contextRequirements: ['form field tree', 'collection metadata'],
          unresolvedReason: 'runtime-field-assign-rules',
          recommendedFallback: {
            value: [],
          },
        },
      },
    ],
  },
};
