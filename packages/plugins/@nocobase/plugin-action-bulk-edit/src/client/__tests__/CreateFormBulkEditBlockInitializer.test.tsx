/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ISchema } from '@formily/react';
import {
  CollectionProvider,
  SchemaInitializerContext,
  SchemaInitializerItemContext,
  SchemaTemplateManagerContext,
} from '@nocobase/client';
import { renderAppOptions, screen, userEvent } from '@nocobase/test/client';
import React from 'react';
import { vi } from 'vitest';
import { CreateFormBulkEditBlockInitializer } from '../CreateFormBulkEditBlockInitializer';

it('adds a native bulk edit form directly when field templates exist for the collection', async () => {
  const insert = vi.fn<[ISchema], void>();
  const templates = [{ key: 'pc', name: 'PC fields', componentName: 'FormItem', collectionName: 'users' }];
  await renderAppOptions({
    Component: () => (
      <CollectionProvider name="users">
        <SchemaTemplateManagerContext.Provider value={{ templates }}>
          <SchemaInitializerContext.Provider
            value={{ insert, options: { name: 'popup:bulkEdit:addBlock' }, visible: true, setVisible: vi.fn() }}
          >
            <SchemaInitializerItemContext.Provider value={{ name: 'form', title: 'Form' }}>
              <CreateFormBulkEditBlockInitializer />
            </SchemaInitializerItemContext.Provider>
          </SchemaInitializerContext.Provider>
        </SchemaTemplateManagerContext.Provider>
      </CollectionProvider>
    ),
  });
  const user = userEvent.setup();
  const formItem = screen.getByRole('menuitem', { name: /Form/ });
  expect(formItem).not.toHaveAttribute('aria-haspopup');
  await user.click(formItem);
  expect(insert).toHaveBeenCalledTimes(1);
  const [block] = insert.mock.calls[0];
  expect(block['x-settings']).toBe('blockSettings:bulkEditForm');
  expect(block['x-acl-action']).toBe('users:update');
  const [form] = Object.values(block.properties) as ISchema[];
  expect(form.properties.grid).toEqual({
    type: 'void',
    'x-component': 'Grid',
    'x-initializer': 'bulkEditForm:configureFields',
    properties: {},
  });
  expect(Object.values(form.properties)).toContainEqual(
    expect.objectContaining({ 'x-initializer': 'bulkEditForm:configureActions' }),
  );
});
