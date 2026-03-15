/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaManifest } from '@nocobase/flow-engine';
import { genericModelNodeSchema } from '../shared';

export const filterFormGridModelInternalSchemaManifest: FlowModelSchemaManifest = {
  use: 'FilterFormGridModel',
  title: 'Filter form grid',
  source: 'official',
  strict: false,
  exposure: 'internal',
  subModelSlots: {
    items: {
      type: 'array',
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
  docs: {
    dynamicHints: [
      {
        kind: 'dynamic-children',
        path: 'FilterFormGridModel.subModels.items',
        message: 'Filter form items depend on filter-target blocks and runtime filter field factories.',
        'x-flow': {
          slotRules: {
            slotKey: 'items',
            type: 'array',
          },
          contextRequirements: ['target block registry', 'filter field factories'],
          unresolvedReason: 'runtime-filter-form-items',
        },
      },
    ],
  },
};
