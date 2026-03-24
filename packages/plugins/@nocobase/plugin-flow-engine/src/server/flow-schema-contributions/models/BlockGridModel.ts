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
  coreBlockGridItemUses,
  createGridLayoutDocs,
  createGridLayoutStepParamsSchema,
  genericModelNodeSchema,
} from '../shared';

export const blockGridModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'BlockGridModel',
  title: 'Block grid',
  source: 'official',
  strict: false,
  exposure: 'internal',
  suggestedUses: ['PageModel', 'RootPageModel'],
  stepParamsSchema: createGridLayoutStepParamsSchema(),
  subModelSlots: {
    items: {
      type: 'array',
      uses: coreBlockGridItemUses,
      dynamic: true,
      schema: genericModelNodeSchema,
      description: 'Block grid items are resolved from runtime block registries and plugin block providers.',
    },
  },
  skeleton: {
    uid: 'todo-grid-uid',
    use: 'BlockGridModel',
    subModels: {
      items: [],
    },
  },
  docs: createGridLayoutDocs({
    use: 'BlockGridModel',
    itemUses: coreBlockGridItemUses,
    prefix: 'block-grid',
    dynamicHints: [
      {
        kind: 'dynamic-children',
        path: 'BlockGridModel.subModels.items',
        message: 'Grid items depend on runtime block registries and collection-aware factories.',
        'x-flow': {
          slotRules: {
            slotKey: 'items',
            type: 'array',
          },
          contextRequirements: ['block registry', 'collection metadata'],
          unresolvedReason: 'runtime-block-grid-items',
        },
      },
    ],
  }),
};
