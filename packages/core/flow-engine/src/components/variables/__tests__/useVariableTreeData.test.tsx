/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useVariableTreeData } from '../useVariableTreeData';

describe('useVariableTreeData', () => {
  describe('Basic functionality', () => {
    it('should initialize with empty options when metaTree is undefined', async () => {
      const { result } = renderHook(() => useVariableTreeData({ metaTree: undefined }));

      await waitFor(() => {
        expect(result.current.options).toEqual([]);
      });

      expect(result.current.options).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.currentPath).toBeUndefined();
    });

    it('should handle empty metaTree array', async () => {
      const { result } = renderHook(() => useVariableTreeData({ metaTree: [] }));

      await waitFor(() => {
        expect(result.current.options).toEqual([]);
      });

      expect(result.current.options).toEqual([]);
      expect(result.current.loading).toBe(false);
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
