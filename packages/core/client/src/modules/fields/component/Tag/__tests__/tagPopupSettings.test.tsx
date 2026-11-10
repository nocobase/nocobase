/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { renderHook } from '@testing-library/react';
import { OpenModeProvider } from '../../../../popup/OpenModeProvider';
import { tagComponentFieldSettings } from '../tagComponentFieldSettings';

const view = vi.hoisted(() => ({
  column: { 'x-component-props': { enableLink: true } },
  association: true,
  readPretty: true,
}));

vi.mock('../../../../../schema-component/antd/table-v2/Table.Column.Decorator', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useColumnSchema: () => ({ fieldSchema: view.column }),
}));
vi.mock('../../../../../schema-component/antd/form-item/FormItem.Settings', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useIsAssociationField: () => view.association,
  useIsFieldReadPretty: () => view.readPretty,
}));

it('offers popup mode and size on a linked read-only association column', () => {
  const item = tagComponentFieldSettings.items.find((item) => item.name === 'openMode');
  const { result, rerender } = renderHook(() => [item.useVisible(), item.useComponentProps()], {
    wrapper: OpenModeProvider,
  });
  expect(result.current).toEqual([
    true,
    expect.objectContaining({ openMode: true, openSize: true, targetSchema: view.column }),
  ]);
  view.column['x-component-props'].enableLink = false;
  rerender();
  expect(result.current[0]).toBe(false);
  view.column['x-component-props'].enableLink = true;
  view.association = false;
  rerender();
  expect(result.current[0]).toBe(false);
  view.association = true;
  view.readPretty = false;
  rerender();
  expect(result.current[0]).toBe(false);
});
