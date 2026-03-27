/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution } from '../../flow-schema-registry';
import { genericModelNodeSchema, recordActionUses, tableColumnStepParamsSchema } from '../shared';

export const tableActionsColumnModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'TableActionsColumnModel',
  title: 'Table actions column',
  source: 'official',
  strict: false,
  exposure: 'internal',
  suggestedUses: ['TableBlockModel'],
  stepParamsSchema: {
    type: 'object',
    properties: {
      tableColumnSettings: (tableColumnStepParamsSchema.properties as any)?.tableColumnSettings,
    },
    additionalProperties: true,
  },
  subModelSlots: {
    actions: {
      type: 'array',
      uses: recordActionUses,
      dynamic: true,
      schema: genericModelNodeSchema,
      description: 'Row action models are resolved from runtime record-action registries.',
    },
  },
  skeleton: {
    uid: 'todo-actions-column-uid',
    use: 'TableActionsColumnModel',
    stepParams: {
      tableColumnSettings: {
        title: {
          title: 'Actions',
        },
      },
    },
    subModels: {
      actions: [],
    },
  },
  docs: {
    dynamicHints: [
      {
        kind: 'dynamic-children',
        path: 'TableActionsColumnModel.subModels.actions',
        message: 'Row actions depend on runtime record-action registries and collection capabilities.',
        'x-flow': {
          slotRules: {
            slotKey: 'actions',
            type: 'array',
            allowedUses: recordActionUses,
          },
          contextRequirements: ['record action registry', 'collection capabilities'],
          unresolvedReason: 'runtime-table-record-actions',
        },
      },
    ],
  },
};
