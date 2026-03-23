/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaManifest, FlowSchemaManifestContribution } from '@nocobase/flow-engine';

function createFieldManifest(use: string, title: string): FlowModelSchemaManifest {
  return {
    use,
    title,
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
      uid: `todo-${use}`.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase(),
      use,
    },
  };
}

export const flowSchemaManifestContribution: FlowSchemaManifestContribution = {
  models: [
    createFieldManifest('VditorFieldModel', 'Vditor'),
    createFieldManifest('DisplayVditorFieldModel', 'Display vditor'),
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
