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
  models: [createFieldContribution('FormulaFieldModel', 'Formula')],
  fieldBindings: [
    {
      context: 'editable-field',
      use: 'FormulaFieldModel',
      interfaces: ['formula'],
      isDefault: true,
    },
    {
      context: 'display-field',
      use: 'DisplayCheckboxFieldModel',
      interfaces: ['formula'],
      isDefault: true,
      conditions: {
        fieldTypes: ['boolean'],
      },
    },
    {
      context: 'display-field',
      use: 'DisplayDateTimeFieldModel',
      interfaces: ['formula'],
      isDefault: true,
      conditions: {
        fieldTypes: ['date'],
      },
    },
    {
      context: 'display-field',
      use: 'DisplayTextFieldModel',
      interfaces: ['formula'],
      isDefault: true,
      conditions: {
        fieldTypes: ['string'],
      },
    },
    {
      context: 'display-field',
      use: 'DisplayNumberFieldModel',
      interfaces: ['formula'],
      isDefault: true,
      conditions: {
        fieldTypes: ['double', 'bigInt', 'integer'],
      },
    },
    {
      context: 'filter-field',
      use: 'InputFieldModel',
      interfaces: ['formula'],
      conditions: {
        fieldTypes: ['string', 'text', 'url', 'uuid', 'email', 'phone', 'nanoid'],
      },
    },
    {
      context: 'filter-field',
      use: 'DateTimeFilterFieldModel',
      interfaces: ['formula'],
      conditions: {
        fieldTypes: ['date'],
      },
    },
    {
      context: 'filter-field',
      use: 'CheckboxFieldModel',
      interfaces: ['formula'],
      conditions: {
        fieldTypes: ['boolean'],
      },
    },
    {
      context: 'filter-field',
      use: 'NumberFieldModel',
      interfaces: ['formula'],
      conditions: {
        fieldTypes: ['integer', 'bigInt', 'double', 'decimal', 'number'],
      },
    },
  ],
  defaults: {
    source: 'plugin',
  },
};
