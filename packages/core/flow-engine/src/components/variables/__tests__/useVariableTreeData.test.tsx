/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useVariableTreeData } from '../useVariableTreeData';

describe.skip('useVariableTreeData', () => {
  describe('Basic functionality', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useVariableTreeData({ metaTree: undefined }));

      expect(result.current.options).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.currentPath).toBeUndefined();
    });

    it('should handle empty metaTree array', () => {
      const { result } = renderHook(() => useVariableTreeData({ metaTree: [] }));

      expect(result.current.options).toEqual([]);
    });
  });

  describe('Value parsing', () => {
    it('should parse value to current path', () => {
      const { result } = renderHook(() =>
        useVariableTreeData({
          metaTree: [],
          value: '{{ ctx.user.name }}',
        }),
      );

      expect(result.current.currentPath).toEqual(['user', 'name']);
    });

    it('should use custom parseValueToPath function', () => {
      const customParse = vi.fn().mockReturnValue(['custom', 'path']);

      const { result } = renderHook(() =>
        useVariableTreeData({
          metaTree: [],
          value: 'custom.value',
          parseValueToPath: customParse,
        }),
      );

      expect(customParse).toHaveBeenCalledWith('custom.value');
      expect(result.current.currentPath).toEqual(['custom', 'path']);
    });

    it('should handle undefined value', () => {
      const { result } = renderHook(() =>
        useVariableTreeData({
          metaTree: [],
          value: undefined,
        }),
      );

      expect(result.current.currentPath).toBeUndefined();
    });
  });

  describe('Context selector item building', () => {
    it('should build context selector item from selected options', () => {
      const { result } = renderHook(() => useVariableTreeData({ metaTree: [] }));

      const selectedOptions = [
        { label: 'User', value: 'user', isLeaf: false, fullPath: ['user'] },
        { label: 'Name', value: 'name', isLeaf: true, fullPath: ['name'] },
      ];

      const contextItem = result.current.buildContextSelectorItemFromSelectedOptions(selectedOptions);

      expect(contextItem).toEqual({
        label: 'Name',
        value: 'name',
        isLeaf: true,
        meta: undefined,
        children: undefined,
        loading: undefined,
        fullPath: ['user', 'name'],
      });
    });

    it('should return null for empty selected options', () => {
      const { result } = renderHook(() => useVariableTreeData({ metaTree: [] }));

      const contextItem = result.current.buildContextSelectorItemFromSelectedOptions([]);
      expect(contextItem).toBeNull();
    });
  });

  describe('Utility functions', () => {
    it('should provide loadInitialOptions function', () => {
      const { result } = renderHook(() => useVariableTreeData({ metaTree: [] }));

      expect(typeof result.current.loadInitialOptions).toBe('function');
    });

    it('should provide handleLoadData function', () => {
      const { result } = renderHook(() => useVariableTreeData({ metaTree: [] }));

      expect(typeof result.current.handleLoadData).toBe('function');
    });
  });

  describe('Loading state ref', () => {
    it('should provide loadedPathsRef', () => {
      const { result } = renderHook(() => useVariableTreeData({ metaTree: [] }));

      expect(result.current.loadedPathsRef.current).toBeInstanceOf(Set);
    });
  });
});
