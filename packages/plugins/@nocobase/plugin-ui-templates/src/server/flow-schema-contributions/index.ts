/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution, FlowSchemaContribution } from '@nocobase/flow-engine';

const referenceBlockModelSchemaContribution: FlowModelSchemaContribution = {
  use: 'ReferenceBlockModel',
  title: 'Block template',
  source: 'plugin',
  strict: false,
  stepParamsSchema: {
    type: 'object',
    properties: {
      referenceSettings: {
        type: 'object',
        properties: {
          target: {
            type: 'object',
            properties: {
              targetUid: { type: 'string' },
              mode: {
                type: 'string',
                enum: ['reference', 'copy'],
              },
            },
            required: ['targetUid'],
            additionalProperties: true,
          },
          useTemplate: {
            type: 'object',
            properties: {
              templateUid: { type: 'string' },
              templateName: { type: 'string' },
              templateDescription: { type: 'string' },
              targetUid: { type: 'string' },
              mode: {
                type: 'string',
                enum: ['reference', 'copy'],
              },
            },
            additionalProperties: true,
          },
        },
        required: ['target'],
        additionalProperties: true,
      },
    },
    additionalProperties: true,
  },
  skeleton: {
    uid: 'todo-reference-block-uid',
    use: 'ReferenceBlockModel',
    stepParams: {
      referenceSettings: {
        target: {
          targetUid: 'todo-target-block-uid',
          mode: 'reference',
        },
      },
    },
  },
  docs: {
    minimalExample: {
      uid: 'reference-users-template',
      use: 'ReferenceBlockModel',
      stepParams: {
        referenceSettings: {
          target: {
            targetUid: 'users-details-template-block',
            mode: 'reference',
          },
        },
      },
    },
    dynamicHints: [
      {
        kind: 'dynamic-ui-schema',
        path: 'ReferenceBlockModel.stepParams.referenceSettings.target.targetUid',
        message: 'Reference targets must point to an existing block UID or a template-derived target block.',
        'x-flow': {
          contextRequirements: ['existing block uid', 'template usage context'],
          unresolvedReason: 'runtime-reference-target-resolution',
          recommendedFallback: {
            targetUid: 'todo-target-block-uid',
            mode: 'reference',
          },
        },
      },
    ],
  },
};

export const flowSchemaContribution: FlowSchemaContribution = {
  inventory: {
    publicTreeRoots: ['ReferenceBlockModel'],
  },
  models: [referenceBlockModelSchemaContribution],
  defaults: {
    source: 'plugin',
  },
};
