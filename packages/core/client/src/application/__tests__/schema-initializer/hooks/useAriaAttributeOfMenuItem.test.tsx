/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { renderHook } from '@testing-library/react-hooks';
import { useAriaAttributeOfMenuItem, SchemaInitializerMenuProvider } from '@nocobase/client';

describe('useAriaAttributeOfMenuItem', () => {
  test('should return attribute with role "menuitem" when not in menu', () => {
    const { result } = renderHook(() => useAriaAttributeOfMenuItem());
    expect(result.current.attribute).toEqual({ role: 'menuitem' });
  });

  test('should return empty attribute when in menu', () => {
    const { result } = renderHook(() => useAriaAttributeOfMenuItem(), {
      wrapper: SchemaInitializerMenuProvider,
    });
    expect(result.current.attribute).toEqual({});
  });
});
