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

export const detailsGridModelInternalSchemaManifest: FlowModelSchemaManifest = {
  use: 'DetailsGridModel',
  title: 'Details grid',
  source: 'official',
  strict: false,
  exposure: 'internal',
  subModelSlots: {
    items: {
      type: 'array',
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
  docs: {
    dynamicHints: [
      {
        kind: 'dynamic-children',
        path: 'DetailsGridModel.subModels.items',
        message: 'Details grid items are resolved from runtime field model factories.',
        'x-flow': {
          slotRules: {
            slotKey: 'items',
            type: 'array',
          },
          contextRequirements: ['details field metadata', 'details item factories'],
          unresolvedReason: 'runtime-details-grid-items',
        },
      },
    ],
  },
};
