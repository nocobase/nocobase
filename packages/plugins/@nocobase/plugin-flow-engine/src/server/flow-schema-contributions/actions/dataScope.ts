/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowActionSchemaContribution } from '@nocobase/flow-engine';
import { dataScopeParamsSchema } from '../shared';

export const dataScopeSchemaContribution: FlowActionSchemaContribution = {
  name: 'dataScope',
  title: 'Data scope',
  source: 'official',
  strict: false,
  paramsSchema: dataScopeParamsSchema,
  docs: {
    minimalExample: {
      filter: {
        logic: '$and',
        items: [],
      },
    },
    commonPatterns: [
      {
        title: 'Empty filter group',
        snippet: {
          filter: {
            logic: '$and',
            items: [],
          },
        },
      },
    ],
    dynamicHints: [
      {
        kind: 'custom-component',
        path: 'actions.dataScope.filter',
        message: 'Filter builder depends on runtime collection metadata.',
        'x-flow': {
          contextRequirements: ['collection metadata', 'variable filter tree'],
          unresolvedReason: 'runtime-filter-builder',
          recommendedFallback: {
            filter: {
              logic: '$and',
              items: [],
            },
          },
        },
      },
    ],
  },
};
