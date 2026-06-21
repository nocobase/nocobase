/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm } from '@formily/core';
import { FieldContext, FormContext, SchemaContext, SchemaOptionsContext } from '@formily/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FlagProvider } from '../../../../flag-provider';
import { BlockContext } from '../../../../block-provider/BlockProvider';
import { CollectionContext } from '../../../../data-source/collection/CollectionProvider';
import { CollectionManagerContext } from '../../../../data-source/collection/CollectionManagerProvider';
import { SchemaComponentContext } from '../../../context';
import { TableColumnDecorator } from '../Table.Column.Decorator';

vi.mock('../__builtins__', () => ({
  useToken: () => ({ token: { margin: 8, marginXS: 4 } }),
}));

vi.mock('../Table.Column.ActionBar', () => ({
  designerCss: () => '',
  TableColumnActionBar: () => null,
}));

const Designer = () => null;
Designer.isNullComponent = true;

describe('TableColumnDecorator', () => {
  it('does not show required asterisk for subtable column when only runtime field.required becomes true', () => {
    const form = createForm();
    const columnField: any = {
      title: '',
      path: ['users', '0', 'name'],
      form: {
        query: vi.fn(() => ({
          take: () => ({
            required: true,
            schema: { required: false },
          }),
        })),
      },
    };
    const columnSchema: any = {
      name: 'name',
      required: false,
      parent: {},
      reduceProperties: (reducer) => reducer(null, { name: 'name', 'x-component': 'CollectionField' }),
    };
    const collection = {
      getField: () => ({ uiSchema: { title: 'Name' } }),
    } as any;
    const collectionManager = {
      getCollectionJoinField: () => null,
    } as any;

    render(
      <FormContext.Provider value={form}>
        <FieldContext.Provider value={columnField}>
          <SchemaContext.Provider value={columnSchema}>
            <SchemaOptionsContext.Provider value={{ components: {} }}>
              <CollectionManagerContext.Provider value={collectionManager}>
                <CollectionContext.Provider value={collection}>
                  <SchemaComponentContext.Provider value={{ designable: false }}>
                    <FlagProvider isInSubTable>
                      <BlockContext.Provider value={{ name: 'table' } as any}>
                        <TableColumnDecorator />
                      </BlockContext.Provider>
                    </FlagProvider>
                  </SchemaComponentContext.Provider>
                </CollectionContext.Provider>
              </CollectionManagerContext.Provider>
            </SchemaOptionsContext.Provider>
          </SchemaContext.Provider>
        </FieldContext.Provider>
      </FormContext.Provider>,
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(document.querySelector('.ant-formily-item-asterisk')).toBeNull();
  });
});
