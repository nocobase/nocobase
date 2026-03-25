/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution, FlowSchemaContribution } from '@nocobase/flow-engine';

const confirmStepParamsSchema = {
  type: 'object',
  properties: {
    enable: { type: 'boolean' },
    title: { type: 'string' },
    content: { type: 'string' },
  },
  additionalProperties: false,
} as const;

const bulkUpdateActionModelSchemaContribution: FlowModelSchemaContribution = {
  use: 'BulkUpdateActionModel',
  title: 'Bulk update action',
  source: 'plugin',
  strict: false,
  stepParamsSchema: {
    type: 'object',
    properties: {
      assignSettings: {
        type: 'object',
        properties: {
          confirm: confirmStepParamsSchema,
          updateMode: {
            type: 'object',
            properties: {
              value: {
                type: 'string',
                enum: ['selected', 'all'],
              },
            },
            required: ['value'],
            additionalProperties: false,
          },
          assignFieldValues: {
            type: 'object',
            properties: {
              assignedValues: {
                type: 'object',
                additionalProperties: true,
              },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: true,
      },
      apply: {
        type: 'object',
        properties: {
          apply: {
            type: 'object',
            properties: {
              assignedValues: {
                type: 'object',
                additionalProperties: true,
              },
            },
            additionalProperties: true,
          },
        },
        additionalProperties: true,
      },
    },
    additionalProperties: true,
  },
  subModelSlots: {
    assignForm: {
      type: 'object',
      use: 'AssignFormModel',
      description: 'Internal assignment form used to configure bulk update field/value pairs.',
    },
  },
  skeleton: {
    uid: 'todo-bulk-update-action-uid',
    use: 'BulkUpdateActionModel',
    stepParams: {
      assignSettings: {
        confirm: {
          enable: false,
          title: 'Bulk update',
          content: 'Are you sure you want to perform the Update record action?',
        },
        updateMode: {
          value: 'selected',
        },
        assignFieldValues: {
          assignedValues: {},
        },
      },
    },
    subModels: {
      assignForm: {
        uid: 'todo-bulk-update-assign-form-uid',
        use: 'AssignFormModel',
      },
    },
  },
  docs: {
    minimalExample: {
      uid: 'bulk-update-users',
      use: 'BulkUpdateActionModel',
      stepParams: {
        assignSettings: {
          updateMode: {
            value: 'selected',
          },
        },
      },
      subModels: {
        assignForm: {
          uid: 'bulk-update-users-assign-form',
          use: 'AssignFormModel',
        },
      },
    },
    dynamicHints: [
      {
        kind: 'dynamic-ui-schema',
        path: 'BulkUpdateActionModel.stepParams.assignSettings.assignFieldValues.assignedValues',
        message: 'Assigned field/value pairs depend on runtime collection fields and assign-form editors.',
        'x-flow': {
          contextRequirements: ['collection fields', 'assign form child tree'],
          unresolvedReason: 'runtime-bulk-update-assigned-values',
          recommendedFallback: {},
        },
      },
    ],
  },
};

export const flowSchemaContribution: FlowSchemaContribution = {
  models: [bulkUpdateActionModelSchemaContribution],
  defaults: {
    source: 'plugin',
  },
};
