/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowActionSchemaManifest } from '@nocobase/flow-engine';
import { sortingRuleParamsSchema } from '../shared';

export const sortingRuleSchemaManifest: FlowActionSchemaManifest = {
  name: 'sortingRule',
  title: 'Default sorting',
  source: 'official',
  strict: false,
  paramsSchema: sortingRuleParamsSchema,
  docs: {
    minimalExample: {
      sort: [],
    },
    commonPatterns: [
      {
        title: 'Sort by createdAt descending',
        snippet: {
          sort: [{ field: 'createdAt', direction: 'desc' }],
        },
      },
    ],
    dynamicHints: [
      {
        kind: 'dynamic-ui-schema',
        path: 'actions.sortingRule.sort[*].field',
        message: 'Sortable field candidates depend on the current collection.',
        'x-flow': {
          contextRequirements: ['collection fields', 'sortable interfaces'],
          unresolvedReason: 'runtime-sort-field-options',
        },
      },
    ],
  },
};
