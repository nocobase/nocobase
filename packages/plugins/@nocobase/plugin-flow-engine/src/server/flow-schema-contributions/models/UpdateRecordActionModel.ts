/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution } from '@nocobase/flow-engine';

const confirmStepParamsSchema = {
  type: 'object',
  properties: {
    enable: { type: 'boolean' },
    title: { type: 'string' },
    content: { type: 'string' },
  },
  additionalProperties: false,
} as const;

export const updateRecordActionModelSchemaContribution: FlowModelSchemaContribution = {
  use: 'UpdateRecordActionModel',
  title: 'Update record action',
  source: 'official',
  strict: false,
  stepParamsSchema: {
    type: 'object',
    properties: {
      assignSettings: {
        type: 'object',
        properties: {
          confirm: confirmStepParamsSchema,
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
              requestConfig: {
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
      description: 'Internal assignment form used to configure field/value pairs.',
    },
  },
  skeleton: {
    uid: 'todo-update-record-action-uid',
    use: 'UpdateRecordActionModel',
    stepParams: {
      assignSettings: {
        confirm: {
          enable: false,
          title: 'Perform the Update record',
          content: 'Are you sure you want to perform the Update record action?',
        },
        assignFieldValues: {
          assignedValues: {},
        },
      },
    },
    subModels: {
      assignForm: {
        uid: 'todo-update-record-assign-form-uid',
        use: 'AssignFormModel',
      },
    },
  },
  docs: {
    minimalExample: {
      uid: 'update-record-users',
      use: 'UpdateRecordActionModel',
      stepParams: {
        assignSettings: {
          confirm: {
            enable: false,
            title: 'Perform the Update record',
            content: 'Are you sure you want to perform the Update record action?',
          },
          assignFieldValues: {
            assignedValues: {},
          },
        },
      },
      subModels: {
        assignForm: {
          uid: 'update-record-users-assign-form',
          use: 'AssignFormModel',
        },
      },
    },
    commonPatterns: [
      {
        title: 'Record update with explicit confirmation',
        snippet: {
          stepParams: {
            assignSettings: {
              confirm: {
                enable: true,
                title: 'Confirm update',
              },
            },
          },
        },
      },
    ],
    dynamicHints: [
      {
        kind: 'dynamic-ui-schema',
        path: 'UpdateRecordActionModel.stepParams.assignSettings.assignFieldValues.assignedValues',
        message:
          'Assigned field/value pairs depend on the runtime collection field tree and RunJS-enabled field editors.',
        'x-flow': {
          contextRequirements: ['collection fields', 'assign form child tree'],
          unresolvedReason: 'runtime-update-record-assigned-values',
          recommendedFallback: {},
        },
      },
    ],
  },
};
