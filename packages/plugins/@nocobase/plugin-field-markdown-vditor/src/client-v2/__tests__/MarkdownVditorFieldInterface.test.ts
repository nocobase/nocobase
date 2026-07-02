/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { defaultToolbar, MarkdownVditorFieldInterface } from '../interface';

vi.mock('../locale', () => ({
  tExpr: (value: string) => value,
}));

describe('MarkdownVditorFieldInterface', () => {
  it('defines the markdown vditor field schema and configuration', () => {
    const fieldInterface = new MarkdownVditorFieldInterface();

    expect(fieldInterface).toMatchObject({
      name: 'vditor',
      type: 'object',
      group: 'media',
      order: 1,
      title: 'Markdown(Vditor)',
      sortable: false,
      default: {
        interface: 'vditor',
        type: 'text',
        length: 'long',
        uiSchema: {
          type: 'string',
          'x-component': 'Input.TextArea',
        },
      },
      availableTypes: ['text', 'json', 'string'],
      filterable: {
        operators: 'bigField',
      },
      titleUsable: true,
    });
    expect(defaultToolbar).toEqual(
      expect.arrayContaining(['headings', 'bold', 'italic', 'link', 'upload', 'fullscreen']),
    );
    expect(fieldInterface.configure.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'uiSchema.x-component-props.fileCollection',
          component: 'Select',
          defaultValue: 'attachments',
          schema: {
            enum: '{{fileCollections}}',
          },
        }),
        expect.objectContaining({
          name: 'uiSchema.x-component-props.toolbar',
          component: 'Select',
          componentProps: {
            mode: 'multiple',
          },
          defaultValue: defaultToolbar,
        }),
      ]),
    );
  });
});
