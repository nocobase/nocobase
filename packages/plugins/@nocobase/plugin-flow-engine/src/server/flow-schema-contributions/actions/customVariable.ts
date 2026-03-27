/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowActionSchemaContribution } from '../../flow-schema-registry';

const customVariableSchema = {
  type: 'object',
  properties: {
    key: { type: 'string' },
    title: { type: 'string' },
    type: {
      type: 'string',
      enum: ['formValue'],
    },
    formUid: { type: 'string' },
  },
  additionalProperties: false,
} as const;

export const customVariableSchemaContribution: FlowActionSchemaContribution = {
  name: 'customVariable',
  title: 'Custom variable',
  source: 'official',
  strict: false,
  paramsSchema: {
    type: 'object',
    properties: {
      variables: {
        type: 'array',
        items: customVariableSchema as any,
      },
    },
    additionalProperties: false,
  },
  docs: {
    minimalExample: {
      variables: [
        {
          key: 'var_form',
          title: 'Current form',
          type: 'formValue',
          formUid: 'form-block-uid',
        },
      ],
    },
  },
};
