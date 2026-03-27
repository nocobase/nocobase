/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowActionSchemaContribution } from '../../flow-schema-registry';
import { linkageRuleValueSchema } from '../shared';

export const fieldLinkageRulesSchemaContribution: FlowActionSchemaContribution = {
  name: 'fieldLinkageRules',
  title: 'Field linkage rules',
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
        path: 'actions.fieldLinkageRules.value',
        message: 'Linkage rule actions depend on current scene and field metadata.',
        'x-flow': {
          contextRequirements: ['action scene', 'field metadata'],
          unresolvedReason: 'runtime-linkage-rules',
          recommendedFallback: {
            value: [],
          },
        },
      },
    ],
  },
};
