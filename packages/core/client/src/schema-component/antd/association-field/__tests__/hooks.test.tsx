/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { SubFormProvider, useSubFormValue } from '../hooks';

describe('useSubFormValue', () => {
  it('should return the correct values from SubFormContext', () => {
    const mockValue = { id: 1, name: 'Test' };
    const mockCollection = { name: 'users' };
    const mockFieldSchema = { type: 'object', properties: {} };
    const mockParent = { value: { parentId: 2 }, collection: { name: 'parents' } };

    const wrapper = ({ children }) => (
      <SubFormProvider
        value={{
          value: mockValue,
          collection: mockCollection as any,
          fieldSchema: mockFieldSchema as any,
          parent: mockParent as any,
        }}
      >
        {children}
      </SubFormProvider>
    );

    const { result } = renderHook(() => useSubFormValue(), { wrapper });

    expect(result.current).toEqual({
      formValue: mockValue,
      collection: mockCollection,
      fieldSchema: mockFieldSchema,
      parent: mockParent,
    });
  });

  it('should return undefined values when SubFormContext is not provided', () => {
    const { result } = renderHook(() => useSubFormValue());

    expect(result.current).toEqual({
      formValue: undefined,
      collection: undefined,
      fieldSchema: undefined,
      parent: undefined,
    });
  });

  it('should update values when SubFormContext changes', () => {
    const initialValue = { id: 1, name: 'Initial' };
    const updatedValue = { id: 1, name: 'Updated' };
    const mockCollection = { name: 'users' };
    const mockFieldSchema = { type: 'object', properties: {} };

    const wrapper = ({ children }) => (
      <SubFormProvider
        value={{
          value: initialValue,
          collection: mockCollection as any,
          fieldSchema: mockFieldSchema as any,
        }}
      >
        {children}
      </SubFormProvider>
    );

    const { result, rerender } = renderHook(() => useSubFormValue(), { wrapper });

    expect(result.current.formValue).toEqual(initialValue);

    // Update the context value
    Object.assign(initialValue, updatedValue);

    rerender();

    expect(result.current.formValue).toEqual(updatedValue);
  });

  it('should use provided parent when available', () => {
    const mockParent = { value: { id: 1 } };
    const wrapper = ({ children }) => (
      <SubFormProvider value={{ parent: mockParent as any } as any}>{children}</SubFormProvider>
    );
    const { result } = renderHook(() => useSubFormValue(), { wrapper });
    expect(result.current.parent).toBe(mockParent);
  });

  it('should use _parent when no parent is provided and skip is false', () => {
    const mockParent = { value: { id: 1 }, skip: false, parent: null };
    const wrapper = ({ children }) => (
      <SubFormProvider value={mockParent as any}>
        <SubFormProvider value={{ skip: false } as any}>{children}</SubFormProvider>
      </SubFormProvider>
    );
    const { result } = renderHook(() => useSubFormValue(), { wrapper });
    expect(result.current.parent).toEqual(mockParent);
  });

  it('should use _parent.parent when _parent.skip is true', () => {
    const mockGrandParent = { value: { id: 1 }, parent: null };
    const wrapper = ({ children }) => (
      <SubFormProvider value={mockGrandParent as any}>
        <SubFormProvider value={{ skip: true } as any}>
          <SubFormProvider value={{} as any}>{children}</SubFormProvider>
        </SubFormProvider>
      </SubFormProvider>
    );
    const { result } = renderHook(() => useSubFormValue(), { wrapper });
    expect(result.current.parent).toEqual(mockGrandParent);
  });
});
