/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  parseValueToPath,
  formatPathToValue,
  loadMetaTreeChildren,
  searchInLoadedNodes,
  buildContextSelectorItems,
  isVariableValue,
  createDefaultConverters,
} from '../utils';
import type { MetaTreeNode } from '../../../flowContext';
import type { ContextSelectorItem } from '../types';

describe('Variable Utils', () => {
  describe('parseValueToPath', () => {
    it('should parse {{ ctx.aaa.bbb }} to path array', () => {
      expect(parseValueToPath('{{ ctx.aaa.bbb }}')).toEqual(['aaa', 'bbb']);
      expect(parseValueToPath('{{ctx.user.name}}')).toEqual(['user', 'name']);
      expect(parseValueToPath('{{ ctx.data.items.0.title }}')).toEqual(['data', 'items', '0', 'title']);
    });

    it('should handle edge cases', () => {
      expect(parseValueToPath('{{ ctx }}')).toEqual([]);
      expect(parseValueToPath('{{ctx}}')).toEqual([]);
      expect(parseValueToPath('not a variable')).toBeUndefined();
      expect(parseValueToPath('')).toBeUndefined();
      expect(parseValueToPath('{{ something.else }}')).toBeUndefined();
    });

    it('should handle whitespace variations', () => {
      expect(parseValueToPath('{{  ctx.aaa.bbb  }}')).toEqual(['aaa', 'bbb']);
      expect(parseValueToPath('{{ ctx.aaa.bbb}}')).toEqual(['aaa', 'bbb']);
      expect(parseValueToPath('{{ctx.aaa.bbb }}')).toEqual(['aaa', 'bbb']);
    });
  });

  describe('loadMetaTreeChildren', () => {
    it('should load async children from MetaTreeNode', async () => {
      const asyncChildren = async () => [
        { name: 'child1', title: 'Child 1', type: 'string', paths: ['parent', 'child1'], parentTitles: ['Parent'] },
        { name: 'child2', title: 'Child 2', type: 'number', paths: ['parent', 'child2'], parentTitles: ['Parent'] },
      ];

      const metaNode: MetaTreeNode = {
        name: 'parent',
        title: 'Parent',
        type: 'object',
        paths: ['parent'],
        children: asyncChildren,
      };

      const result = await loadMetaTreeChildren(metaNode);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('child1');
      expect(result[1].name).toBe('child2');
    });

    it('should return empty array for nodes without children', async () => {
      const metaNode: MetaTreeNode = {
        name: 'leaf',
        title: 'Leaf',
        type: 'string',
        paths: ['leaf'],
      };

      const result = await loadMetaTreeChildren(metaNode);
      expect(result).toEqual([]);
    });

    it('should handle sync children array', async () => {
      const metaNode: MetaTreeNode = {
        name: 'parent',
        title: 'Parent',
        type: 'object',
        paths: ['parent'],
        children: [
          { name: 'child1', title: 'Child 1', type: 'string', paths: ['parent', 'child1'], parentTitles: ['Parent'] },
        ],
      };

      const result = await loadMetaTreeChildren(metaNode);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('child1');
    });
  });

  describe('searchInLoadedNodes', () => {
    const mockOptions: ContextSelectorItem[] = [
      {
        label: 'User',
        value: 'user',
        paths: ['user'],
        children: [
          { label: 'Name', value: 'name', isLeaf: true, paths: ['user', 'name'] },
          { label: 'Email', value: 'email', isLeaf: true, paths: ['user', 'email'] },
        ],
      },
      {
        label: 'Data',
        value: 'data',
        paths: ['data'],
        children: [{ label: 'Items', value: 'items', isLeaf: true, paths: ['data', 'items'] }],
      },
    ];

    it('should search in cascader options by label', () => {
      const result = searchInLoadedNodes(mockOptions, 'User');
      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('User');
    });

    it('should search nested options', () => {
      const result = searchInLoadedNodes(mockOptions, 'Name');
      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('Name');
    });

    it('should return empty array for no matches', () => {
      const result = searchInLoadedNodes(mockOptions, 'NonExistent');
      expect(result).toEqual([]);
    });

    it('should handle case insensitive search', () => {
      const result = searchInLoadedNodes(mockOptions, 'user');
      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('User');
    });

    it('should return the same object instances without creating new ones', () => {
      const result = searchInLoadedNodes(mockOptions, 'User');
      expect(result).toHaveLength(1);
      // Verify that the returned object is the exact same instance as the original
      expect(result[0]).toBe(mockOptions[0]);
      expect(result[0].paths).toBe(mockOptions[0].paths);

      const nestedResult = searchInLoadedNodes(mockOptions, 'Name');
      expect(nestedResult).toHaveLength(1);
      // Verify that nested search also returns the same instance
      expect(nestedResult[0]).toBe(mockOptions[0].children![0]);
      expect(nestedResult[0].paths).toBe(mockOptions[0].children![0].paths);
    });
  });

  describe('buildContextSelectorItems', () => {
    it('should convert MetaTreeNode[] to ContextSelectorItem[]', () => {
      const metaTree: MetaTreeNode[] = [
        {
          name: 'user',
          title: 'User',
          type: 'object',
          paths: ['user'],
          children: [
            { name: 'name', title: 'Name', type: 'string', paths: ['user', 'name'], parentTitles: ['User'] },
            { name: 'email', title: 'Email', type: 'string', paths: ['user', 'email'], parentTitles: ['User'] },
          ],
        },
        {
          name: 'data',
          title: 'Data',
          type: 'string',
          paths: ['data'],
        },
      ];

      const result = buildContextSelectorItems(metaTree);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        label: 'User',
        value: 'user',
        isLeaf: false,
        meta: metaTree[0],
        paths: ['user'],
        children: [
          { label: 'Name', value: 'name', isLeaf: true, meta: metaTree[0].children?.[0], paths: ['user', 'name'] },
          {
            label: 'Email',
            value: 'email',
            isLeaf: true,
            meta: metaTree[0].children?.[1],
            paths: ['user', 'email'],
          },
        ],
      });
      expect(result[1]).toEqual({
        label: 'Data',
        value: 'data',
        isLeaf: true,
        meta: metaTree[1],
        paths: ['data'],
      });
    });

    it('should handle async children by marking as not leaf', () => {
      const metaTree: MetaTreeNode[] = [
        {
          name: 'async',
          title: 'Async Node',
          type: 'object',
          paths: ['async'],
          children: async () => [],
        },
      ];

      const result = buildContextSelectorItems(metaTree);
      expect(result[0]).toEqual({
        label: 'Async Node',
        value: 'async',
        isLeaf: false,
        meta: metaTree[0],
        paths: ['async'],
      });
    });

    it('should handle invalid metaTree input', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(buildContextSelectorItems(null as any)).toEqual([]);
      expect(buildContextSelectorItems(undefined as any)).toEqual([]);
      expect(buildContextSelectorItems({} as any)).toEqual([]);

      expect(consoleSpy).toHaveBeenCalledTimes(3);
      consoleSpy.mockRestore();
    });

    it('should use name as fallback when title is missing', () => {
      const metaTree: MetaTreeNode[] = [
        {
          name: 'test',
          type: 'object',
          title: '',
          paths: ['test'],
        },
      ];

      const result = buildContextSelectorItems(metaTree);

      expect(result).toEqual([
        {
          label: 'test',
          value: 'test',
          isLeaf: true,
          meta: { name: 'test', type: 'object', title: '', paths: ['test'] },
          paths: ['test'],
        },
      ]);
    });
  });

  describe('isVariableValue', () => {
    it('should detect variable values', () => {
      expect(isVariableValue('{{ ctx.user.name }}')).toBe(true);
      expect(isVariableValue('{{ctx.data}}')).toBe(true);
      expect(isVariableValue('{{ ctx.items.0.title }}')).toBe(true);
    });

    it('should return false for non-variable values', () => {
      expect(isVariableValue('plain text')).toBe(false);
      expect(isVariableValue('123')).toBe(false);
      expect(isVariableValue('')).toBe(false);
      expect(isVariableValue(null)).toBe(false);
      expect(isVariableValue(undefined)).toBe(false);
      expect(isVariableValue({ key: 'value' })).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isVariableValue('{{ something.else }}')).toBe(false);
      expect(isVariableValue('{{ ctx }}')).toBe(true);
      expect(isVariableValue('{ctx.user}')).toBe(false);
      expect(isVariableValue('{{ ctx.user')).toBe(false);
      expect(isVariableValue('ctx.user }}')).toBe(false);
    });
  });

  describe('createDefaultConverters', () => {
    it('should create default converters', () => {
      const converters = createDefaultConverters();
      expect(converters).toHaveProperty('resolvePathFromValue');
      expect(converters).toHaveProperty('resolveValueFromPath');
      expect(typeof converters.resolvePathFromValue).toBe('function');
      expect(typeof converters.resolveValueFromPath).toBe('function');
    });

    it('should resolve path from variable value', () => {
      const converters = createDefaultConverters();
      expect(converters.resolvePathFromValue?.('{{ ctx.user.name }}')).toEqual(['user', 'name']);
      expect(converters.resolvePathFromValue?.('static value')).toBeUndefined();
    });
  });
});
