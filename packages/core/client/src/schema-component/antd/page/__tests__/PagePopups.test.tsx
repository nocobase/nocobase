/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getPopupPath, insertChildToParentSchema } from '../PagePopups';

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

    insertChildToParentSchema({ childSchema, props: { params, context } as any, parentSchema });

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

describe('getPopupPath', () => {
  it('should return the popup path', () => {
    const location: any = {
      pathname: '/Users/Apple/Projects/nocobase/packages/core/client/src/schema-component/antd/page/popups/nestedPopup',
    };

    const result = getPopupPath(location);

    expect(result).toEqual('nestedPopup');
  });

  it('should return the nested popup path', () => {
    const location: any = {
      pathname:
        '/Users/Apple/Projects/nocobase/packages/core/client/src/schema-component/antd/page/popups/nestedPopup/abc/def/popups/nestedPopup2/abc2/def2',
    };

    const result = getPopupPath(location);

    expect(result).toEqual('nestedPopup/abc/def/popups/nestedPopup2/abc2/def2');
  });

  it('should return an empty string if there is no popup path', () => {
    const location: any = {
      pathname: '/Users/Apple/Projects/nocobase/packages/core/client/src/schema-component/antd/page',
    };

    const result = getPopupPath(location);

    expect(result).toEqual('');
  });
});
