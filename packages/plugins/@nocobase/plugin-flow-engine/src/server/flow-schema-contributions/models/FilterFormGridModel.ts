/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution } from '../../flow-schema-registry';
import {
  createGridLayoutDocs,
  createGridLayoutStepParamsSchema,
  filterFormGridItemUses,
  genericModelNodeSchema,
} from '../shared';

export const filterFormGridModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'FilterFormGridModel',
  title: 'Filter form grid',
  source: 'official',
  strict: false,
  exposure: 'internal',
  suggestedUses: ['FilterFormBlockModel'],
  stepParamsSchema: createGridLayoutStepParamsSchema(),
  subModelSlots: {
    items: {
      type: 'array',
      uses: filterFormGridItemUses,
      dynamic: true,
      schema: genericModelNodeSchema,
      description: 'Filter form items are resolved from runtime filter field registries.',
    },
  },
  skeleton: {
    uid: 'todo-filter-grid-uid',
    use: 'FilterFormGridModel',
    subModels: {
      items: [],
    },
  },
  docs: createGridLayoutDocs({
    use: 'FilterFormGridModel',
    itemUses: filterFormGridItemUses,
    prefix: 'filter-form-grid',
    dynamicHints: [
      {
        kind: 'dynamic-children',
        path: 'FilterFormGridModel.subModels.items',
        message: 'Filter form items depend on filter-target blocks and runtime filter field factories.',
        'x-flow': {
          slotRules: {
            slotKey: 'items',
            type: 'array',
            allowedUses: filterFormGridItemUses,
          },
          contextRequirements: ['target block registry', 'filter field factories'],
          unresolvedReason: 'runtime-filter-form-items',
        },
      },
    ],
  }),
};
