/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { AttachmentURLFieldInterface } from '../interfaces/attachment-url';

describe('AttachmentURLFieldInterface', () => {
  it('defines the attachment URL field schema and configuration', () => {
    const fieldInterface = new AttachmentURLFieldInterface();

    expect(fieldInterface).toMatchObject({
      name: 'attachmentURL',
      type: 'object',
      group: 'media',
      title: '{{t("Attachment (URL)")}}',
      default: {
        interface: 'attachmentURL',
        type: 'string',
        uiSchema: {
          type: 'string',
          'x-component': 'Input',
        },
      },
      availableTypes: ['string', 'text'],
      validationType: 'string',
      availableValidationOptions: ['min', 'max', 'length', 'pattern'],
      filterable: {
        operators: 'bigField',
        nested: true,
      },
      titleUsable: true,
    });
    expect(fieldInterface.configure.items).toEqual([
      expect.objectContaining({
        name: 'target',
        component: 'Select',
        required: true,
        defaultValue: 'attachments',
        schema: {
          enum: '{{fileCollections}}',
        },
      }),
      expect.objectContaining({
        name: 'targetKey',
        defaultValue: 'id',
        hidden: true,
      }),
    ]);
  });
});
