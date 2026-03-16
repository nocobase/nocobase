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

export const assignFormGridModelInternalSchemaManifest: FlowModelSchemaManifest = {
  use: 'AssignFormGridModel',
  title: 'Assign form grid',
  source: 'official',
  strict: true,
  exposure: 'internal',
  suggestedUses: ['UpdateRecordActionModel'],
  subModelSlots: {
    items: {
      type: 'array',
      uses: ['AssignFormItemModel'],
      dynamic: true,
      schema: genericModelNodeSchema,
      description: 'Assign form items are resolved from runtime collection field factories.',
    },
  },
  skeleton: {
    uid: 'todo-assign-form-grid-uid',
    use: 'AssignFormGridModel',
    subModels: {
      items: [],
    },
  },
  docs: {
    dynamicHints: [
      {
        kind: 'dynamic-children',
        path: 'AssignFormGridModel.subModels.items',
        message: 'Assign form items depend on runtime collection fields and editable field bindings.',
        'x-flow': {
          slotRules: {
            slotKey: 'items',
            type: 'array',
            allowedUses: ['AssignFormItemModel'],
          },
          contextRequirements: ['collection fields', 'editable field bindings'],
          unresolvedReason: 'runtime-assign-form-items',
        },
      },
    ],
  },
};
