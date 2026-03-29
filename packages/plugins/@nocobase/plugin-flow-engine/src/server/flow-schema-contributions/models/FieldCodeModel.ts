/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution, FlowSchemaContribution } from '../../flow-schema-registry';

function createFieldContribution(use: string, title: string): FlowModelSchemaContribution {
  return {
    use,
    title,
    source: 'plugin',
    strict: false,
    exposure: 'internal',
    stepParamsSchema: {
      type: 'object',
      properties: {
        fieldSettings: {
          type: 'object',
          properties: {
            init: {
              type: 'object',
              properties: {
                dataSourceKey: { type: 'string' },
                collectionName: { type: 'string' },
                fieldPath: { type: 'string' },
                associationPathName: { type: 'string' },
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
      uid: `todo-${use}`.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase(),
      use,
    },
  };
}

export const flowSchemaContribution: FlowSchemaContribution = {
  models: [
    createFieldContribution('CodeFieldModel', 'Code'),
    createFieldContribution('DisplayCodeFieldModel', 'Display code'),
  ],
  fieldBindings: [
    {
      context: 'editable-field',
      use: 'CodeFieldModel',
      interfaces: ['code'],
      isDefault: true,
    },
    {
      context: 'display-field',
      use: 'DisplayCodeFieldModel',
      interfaces: ['code'],
      isDefault: true,
    },
    {
      context: 'filter-field',
      use: 'InputFieldModel',
      interfaces: ['code'],
      isDefault: true,
    },
  ],
  defaults: {
    source: 'plugin',
  },
};
