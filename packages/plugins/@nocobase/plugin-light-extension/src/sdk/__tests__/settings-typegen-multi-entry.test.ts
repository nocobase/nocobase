/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { generateClientSettingsTypes } from '../settings-typegen';

describe('light extension settings typegen multi entry registry', () => {
  it('keeps same-entry-name settings isolated by target and kind', () => {
    const result = generateClientSettingsTypes({
      files: [
        {
          path: 'src/client/js-blocks/product-list/settings.json',
          content: JSON.stringify({
            type: 'object',
            properties: {
              title: { type: 'string' },
              pageSize: { type: 'integer' },
            },
          }),
        },
        {
          path: 'src/client/js-actions/product-list/settings.json',
          content: JSON.stringify({
            type: 'object',
            properties: {
              confirm: { type: 'boolean' },
            },
          }),
        },
        {
          path: 'src/client/js-blocks/order-list/settings.json',
          content: JSON.stringify({
            type: 'object',
            properties: {
              orderStatus: { type: 'string', enum: ['open', 'closed'] },
              limit: { type: 'integer' },
            },
          }),
        },
      ],
    });

    const byPath = new Map(result.files.map((file) => [file.path, file.content]));
    const productBlock = byPath.get('.light-extension/types/client/js-block/product-list.d.ts') || '';
    const productAction = byPath.get('.light-extension/types/client/js-action/product-list.d.ts') || '';
    const orderBlock = byPath.get('.light-extension/types/client/js-block/order-list.d.ts') || '';
    const registry = byPath.get('.light-extension/types/index.d.ts') || '';

    expect(productBlock).toContain('title?: string;');
    expect(productBlock).toContain('pageSize?: number;');
    expect(productBlock).not.toContain('confirm');
    expect(productAction).toContain('confirm?: boolean;');
    expect(productAction).not.toContain('pageSize');
    expect(orderBlock).toContain('orderStatus?: "open" | "closed";');
    expect(orderBlock).toContain('limit?: number;');
    expect(registry).toContain('"client/js-block/product-list": ClientJsBlockProductListSettings;');
    expect(registry).toContain('"client/js-action/product-list": ClientJsActionProductListSettings;');
    expect(registry).toContain('"client/js-block/order-list": ClientJsBlockOrderListSettings;');
  });
});
