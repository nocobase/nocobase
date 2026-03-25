/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution } from '@nocobase/flow-engine';
import { formSubmitSettingsStepParamsSchema, linkageRuleValueSchema } from '../shared';

export const formSubmitActionModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'FormSubmitActionModel',
  title: 'Form submit action',
  source: 'official',
  strict: false,
  exposure: 'internal',
  suggestedUses: ['CreateFormModel', 'EditFormModel'],
  stepParamsSchema: {
    type: 'object',
    properties: {
      buttonSettings: {
        type: 'object',
        properties: {
          general: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              type: { type: 'string' },
              danger: { type: 'boolean' },
              icon: { type: ['string', 'null'] },
            },
            additionalProperties: true,
          },
          linkageRules: linkageRuleValueSchema,
        },
        additionalProperties: true,
      },
      submitSettings: formSubmitSettingsStepParamsSchema,
    },
    additionalProperties: true,
  },
  skeleton: {
    uid: 'todo-form-submit-action-uid',
    use: 'FormSubmitActionModel',
    stepParams: {
      buttonSettings: {
        general: {
          title: 'Submit',
          type: 'primary',
        },
      },
      submitSettings: {
        confirm: {
          enable: false,
          title: 'Submit record',
          content: 'Are you sure you want to save it?',
        },
      },
    },
  },
};
