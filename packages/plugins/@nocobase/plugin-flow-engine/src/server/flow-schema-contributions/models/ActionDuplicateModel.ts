/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution, FlowSchemaContribution } from '../../flow-schema-registry';

const confirmStepParamsSchema = {
  type: 'object',
  properties: {
    enable: { type: 'boolean' },
    title: { type: 'string' },
    content: { type: 'string' },
  },
  additionalProperties: false,
} as const;

const duplicateActionModelSchemaContribution: FlowModelSchemaContribution = {
  use: 'DuplicateActionModel',
  title: 'Duplicate action',
  source: 'plugin',
  strict: false,
  stepParamsSchema: {
    type: 'object',
    properties: {
      duplicateModeSettings: {
        type: 'object',
        properties: {
          duplicateMode: {
            type: 'object',
            properties: {
              duplicateMode: {
                type: 'string',
                enum: ['quickDulicate', 'continueduplicate'],
              },
              collection: { type: 'string' },
              duplicateFields: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            additionalProperties: true,
          },
        },
        additionalProperties: true,
      },
      duplicateSettings: {
        type: 'object',
        properties: {
          confirm: confirmStepParamsSchema,
        },
        additionalProperties: true,
      },
      popupSettings: {
        type: 'object',
        properties: {
          confirm: confirmStepParamsSchema,
          openView: {
            type: 'object',
            properties: {
              uid: { type: 'string' },
              mode: {
                type: 'string',
                enum: ['drawer', 'dialog', 'embed'],
              },
              size: {
                type: 'string',
                enum: ['small', 'medium', 'large'],
              },
              popupTemplateUid: { type: 'string' },
              popupTemplateMode: {
                type: 'string',
                enum: ['reference', 'copy'],
              },
              viewUid: { type: 'string' },
              dataSourceKey: { type: 'string' },
              collectionName: { type: 'string' },
            },
            additionalProperties: true,
          },
        },
        additionalProperties: true,
      },
    },
    additionalProperties: true,
  },
  skeleton: {
    uid: 'todo-duplicate-action-uid',
    use: 'DuplicateActionModel',
    stepParams: {
      duplicateModeSettings: {
        duplicateMode: {
          duplicateMode: 'quickDulicate',
        },
      },
      duplicateSettings: {
        confirm: {
          enable: false,
          title: 'Duplicate record',
          content: 'Are you sure you want to duplicate it?',
        },
      },
      popupSettings: {
        openView: {
          mode: 'drawer',
          size: 'medium',
        },
      },
    },
  },
  docs: {
    minimalExample: {
      uid: 'duplicate-users',
      use: 'DuplicateActionModel',
      stepParams: {
        duplicateModeSettings: {
          duplicateMode: {
            duplicateMode: 'quickDulicate',
          },
        },
      },
    },
    dynamicHints: [
      {
        kind: 'dynamic-ui-schema',
        path: 'DuplicateActionModel.stepParams.duplicateModeSettings.duplicateMode.duplicateFields',
        message: 'Duplicate field selection depends on the runtime collection inherit chain and field tree.',
        'x-flow': {
          contextRequirements: ['collection inherit chain', 'collection field tree'],
          unresolvedReason: 'runtime-duplicate-fields',
          recommendedFallback: [],
        },
      },
    ],
  },
};

export const flowSchemaContribution: FlowSchemaContribution = {
  models: [duplicateActionModelSchemaContribution],
  defaults: {
    source: 'plugin',
  },
};
