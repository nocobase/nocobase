/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution, FlowSchemaContribution } from '../../flow-schema-registry';

const attachmentUrlFieldModelSchemaContribution: FlowModelSchemaContribution = {
  use: 'AttachmentURLFieldModel',
  title: 'Attachment URL',
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
    uid: 'todo-attachment-url-field-model',
    use: 'AttachmentURLFieldModel',
  },
};

export const flowSchemaContribution: FlowSchemaContribution = {
  models: [attachmentUrlFieldModelSchemaContribution],
  fieldBindings: [
    {
      context: 'editable-field',
      use: 'AttachmentURLFieldModel',
      interfaces: ['attachmentURL'],
      isDefault: true,
    },
    {
      context: 'display-field',
      use: 'DisplayTextFieldModel',
      interfaces: ['attachmentURL'],
      isDefault: true,
    },
  ],
  defaults: {
    source: 'plugin',
  },
};
