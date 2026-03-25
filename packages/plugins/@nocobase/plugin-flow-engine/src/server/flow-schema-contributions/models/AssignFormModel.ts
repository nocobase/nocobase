/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution } from '@nocobase/flow-engine';
import { formBlockBaseStepParamsSchema } from '../shared';

export const assignFormModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'AssignFormModel',
  title: 'Field assignments',
  source: 'official',
  strict: false,
  exposure: 'internal',
  suggestedUses: ['UpdateRecordActionModel'],
  stepParamsSchema: {
    type: 'object',
    properties: {
      ...(((formBlockBaseStepParamsSchema as any).properties || {}) as Record<string, any>),
      resourceSettings: {
        type: 'object',
        properties: {
          init: {
            type: 'object',
            properties: {
              dataSourceKey: { type: 'string' },
              collectionName: { type: 'string' },
            },
            required: ['dataSourceKey', 'collectionName'],
            additionalProperties: true,
          },
        },
        additionalProperties: true,
      },
    },
    additionalProperties: true,
  },
  subModelSlots: {
    grid: {
      type: 'object',
      use: 'AssignFormGridModel',
      description: 'Grid container used to define assigned field/value pairs.',
    },
  },
  skeleton: {
    uid: 'todo-assign-form-uid',
    use: 'AssignFormModel',
    stepParams: {
      resourceSettings: {
        init: {
          dataSourceKey: 'main',
          collectionName: 'users',
        },
      },
      formModelSettings: {
        layout: {
          layout: 'vertical',
          colon: true,
        },
        assignRules: {
          value: [],
        },
      },
      eventSettings: {
        linkageRules: {
          value: [],
        },
      },
    },
    subModels: {
      grid: {
        uid: 'todo-assign-form-grid-uid',
        use: 'AssignFormGridModel',
      },
    },
  },
  docs: {
    dynamicHints: [
      {
        kind: 'dynamic-ui-schema',
        path: 'AssignFormModel.stepParams.resourceSettings.init',
        message: 'Assign form resource settings are typically injected from the parent action collection context.',
        'x-flow': {
          contextRequirements: ['parent action collection context'],
          unresolvedReason: 'runtime-assign-form-resource-context',
          recommendedFallback: {
            dataSourceKey: 'main',
            collectionName: 'users',
          },
        },
      },
    ],
  },
};
