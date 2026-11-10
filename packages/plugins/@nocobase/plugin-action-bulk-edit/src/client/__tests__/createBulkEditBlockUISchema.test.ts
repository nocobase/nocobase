/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createBulkEditBlockUISchema } from '../createBulkEditBlockUISchema';
import type { ISchema } from '@formily/react';

describe('bulk edit field templates', () => {
  it.each([
    { type: 'void', 'x-component': 'Grid', properties: { title: { type: 'string' } } },
    { type: 'void', 'x-component': 'Reference', 'x-component-props': { templateKey: 'reference' } },
  ])('keeps the selected template inside the bulk edit block', (templateSchema) => {
    const block = createBulkEditBlockUISchema({ dataSource: 'main', collectionName: 'orders', templateSchema });
    expect(block['x-acl-action']).toBe('orders:update');
    expect(block['x-settings']).toBe('blockSettings:bulkEditForm');
    const form = Object.values(block.properties)[0] as ISchema;
    expect(form.properties['grid']).toBe(templateSchema);
    expect(Object.values(form.properties)).toContainEqual(
      expect.objectContaining({
        'x-initializer': 'bulkEditForm:configureActions',
      }),
    );
  });
});
