/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution } from '@nocobase/flow-engine';
import {
  createGridLayoutDocs,
  createGridLayoutStepParamsSchema,
  detailsGridItemUses,
  genericModelNodeSchema,
} from '../shared';

export const detailsGridModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'DetailsGridModel',
  title: 'Details grid',
  source: 'official',
  strict: false,
  exposure: 'internal',
  suggestedUses: ['DetailsBlockModel'],
  stepParamsSchema: createGridLayoutStepParamsSchema(),
  subModelSlots: {
    items: {
      type: 'array',
      uses: detailsGridItemUses,
      dynamic: true,
      schema: genericModelNodeSchema,
      description: 'Details grid items depend on field metadata and runtime item factories.',
    },
  },
  skeleton: {
    uid: 'todo-details-grid-uid',
    use: 'DetailsGridModel',
    subModels: {
      items: [],
    },
  },
  docs: createGridLayoutDocs({
    use: 'DetailsGridModel',
    itemUses: detailsGridItemUses,
    prefix: 'details-grid',
    dynamicHints: [
      {
        kind: 'dynamic-children',
        path: 'DetailsGridModel.subModels.items',
        message: 'Details grid items are resolved from runtime field model factories.',
        'x-flow': {
          slotRules: {
            slotKey: 'items',
            type: 'array',
            allowedUses: detailsGridItemUses,
          },
          contextRequirements: ['details field metadata', 'details item factories'],
          unresolvedReason: 'runtime-details-grid-items',
        },
      },
    ],
  }),
};
