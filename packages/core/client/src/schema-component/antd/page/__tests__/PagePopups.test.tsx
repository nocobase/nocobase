/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { insertChildToParentSchema } from '../PagePopups';

vi.mock('@formily/shared', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    uid() {
      return 'nestedPopup';
    },
  };
});

describe('insertToPopupSchema', () => {
  it('should insert childSchema to parentSchema', () => {
    const childSchema = {
      type: 'string',
      'x-component': 'Input',
    };
    const params: any = {
      foo: 'bar',
    };
    const context: any = {
      bar: 'foo',
    };
    const parentSchema = {
      type: 'object',
      properties: {
        popup: {
          type: 'void',
          properties: {},
        },
      },
    };

    insertChildToParentSchema(childSchema, { params, context }, parentSchema);

    expect(parentSchema).toEqual({
      type: 'object',
      properties: {
        popup: {
          type: 'void',
          properties: {
            nestedPopup: {
              type: 'void',
              'x-component': 'PagePopupsItemProvider',
              'x-component-props': {
                params,
                context,
              },
              properties: {
                popupAction: childSchema,
              },
            },
          },
        },
      },
    });
  });
});
