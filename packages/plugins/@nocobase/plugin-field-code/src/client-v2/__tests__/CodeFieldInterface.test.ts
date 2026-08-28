/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { CodeFieldInterface } from '../interface';
import { LANGUAGES_LIST } from '../languages';

describe('CodeFieldInterface', () => {
  it('defines the code field schema and language configuration', () => {
    const fieldInterface = new CodeFieldInterface();

    expect(fieldInterface).toMatchObject({
      name: 'code',
      type: 'object',
      group: 'advanced',
      order: 1,
      sortable: true,
      default: {
        interface: 'code',
        type: 'text',
        uiSchema: {
          type: 'string',
          'x-component': 'Input.TextArea',
        },
      },
      availableTypes: ['text', 'string'],
      filterable: {
        operators: 'bigField',
      },
      titleUsable: false,
    });
    expect(fieldInterface.configure.items).toEqual([
      expect.objectContaining({
        name: 'uiSchema.x-component-props.language',
        component: 'Select',
        defaultValue: 'javascript',
        options: LANGUAGES_LIST.map((item) => ({
          label: item.label,
          value: item.value,
        })),
      }),
    ]);
  });
});
