/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaManifest, FlowSchemaManifestContribution } from '@nocobase/flow-engine';

const sortFieldModelSchemaManifest: FlowModelSchemaManifest = {
  use: 'SortFieldModel',
  title: 'Sort',
  source: 'plugin',
  strict: true,
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
    uid: 'todo-sort-field-model',
    use: 'SortFieldModel',
  },
};

export const flowSchemaManifestContribution: FlowSchemaManifestContribution = {
  models: [sortFieldModelSchemaManifest],
  fieldBindings: [
    {
      context: 'editable-field',
      use: 'SortFieldModel',
      interfaces: ['sort'],
      isDefault: true,
    },
    {
      context: 'display-field',
      use: 'DisplayNumberFieldModel',
      interfaces: ['sort'],
      isDefault: true,
    },
  ],
  inventory: {
    expectedDescendantModels: ['SortFieldModel'],
  },
  defaults: {
    source: 'plugin',
  },
};
