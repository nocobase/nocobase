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

export const detailsFieldLinkageRulesSchemaContribution: FlowActionSchemaContribution = {
  name: 'detailsFieldLinkageRules',
  title: 'Details field linkage rules',
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
        path: 'actions.detailsFieldLinkageRules.value',
        message: 'Details field linkage actions depend on details-scene field metadata and supported rule actions.',
        'x-flow': {
          contextRequirements: ['details field metadata', 'details linkage actions'],
          unresolvedReason: 'runtime-details-linkage-rules',
          recommendedFallback: {
            value: [],
          },
        },
      },
    ],
  },
};
