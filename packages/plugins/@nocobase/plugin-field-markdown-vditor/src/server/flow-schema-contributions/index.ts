/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution, FlowSchemaContribution } from '@nocobase/flow-engine';

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
    createFieldContribution('VditorFieldModel', 'Vditor'),
    createFieldContribution('DisplayVditorFieldModel', 'Display vditor'),
  ],
  fieldBindings: [
    {
      context: 'editable-field',
      use: 'VditorFieldModel',
      interfaces: ['vditor', 'markdown'],
      isDefault: true,
    },
    {
      context: 'display-field',
      use: 'DisplayVditorFieldModel',
      interfaces: ['vditor', 'markdown'],
      isDefault: true,
    },
  ],
  defaults: {
    source: 'plugin',
  },
};
