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
  buildCascaderOptions,
  isVariableValue,
  createDefaultConverters,
  detectComponentTypeFromMeta,
  detectComponentTypeFromFieldName,
} from '../utils';
import type { MetaTreeNode } from '../../../flowContext';
import type { CascaderOption } from '../types';

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
      expect(parseValueToPath('not a variable')).toBeNull();
      expect(parseValueToPath('')).toBeNull();
      expect(parseValueToPath('{{ something.else }}')).toBeNull();
    });

    it('should handle whitespace variations', () => {
      expect(parseValueToPath('{{  ctx.aaa.bbb  }}')).toEqual(['aaa', 'bbb']);
      expect(parseValueToPath('{{ ctx.aaa.bbb}}')).toEqual(['aaa', 'bbb']);
      expect(parseValueToPath('{{ctx.aaa.bbb }}')).toEqual(['aaa', 'bbb']);
    });
  });

  describe('formatPathToValue', () => {
    it('should format path array to {{ ctx.aaa.bbb }}', () => {
      expect(formatPathToValue(['aaa', 'bbb'])).toBe('{{ ctx.aaa.bbb }}');
      expect(formatPathToValue(['user', 'name'])).toBe('{{ ctx.user.name }}');
      expect(formatPathToValue(['data', 'items', '0', 'title'])).toBe('{{ ctx.data.items.0.title }}');
    });

    it('should handle empty path', () => {
      expect(formatPathToValue([])).toBe('{{ ctx }}');
    });

    it('should handle single path element', () => {
      expect(formatPathToValue(['user'])).toBe('{{ ctx.user }}');
    });
  });

  describe('loadMetaTreeChildren', () => {
    it('should load async children from MetaTreeNode', async () => {
      const asyncChildren = async () => [
        { name: 'child1', title: 'Child 1', type: 'string' },
        { name: 'child2', title: 'Child 2', type: 'number' },
      ];

      const metaNode: MetaTreeNode = {
        name: 'parent',
        title: 'Parent',
        type: 'object',
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
      };

      const result = await loadMetaTreeChildren(metaNode);
      expect(result).toEqual([]);
    });

    it('should handle sync children array', async () => {
      const metaNode: MetaTreeNode = {
        name: 'parent',
        title: 'Parent',
        type: 'object',
        children: [{ name: 'child1', title: 'Child 1', type: 'string' }],
      };

      const result = await loadMetaTreeChildren(metaNode);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('child1');
    });
  });

  describe('searchInLoadedNodes', () => {
    const mockOptions: CascaderOption[] = [
      {
        label: 'User',
        value: 'user',
        children: [
          { label: 'Name', value: 'name', isLeaf: true },
          { label: 'Email', value: 'email', isLeaf: true },
        ],
      },
      {
        label: 'Data',
        value: 'data',
        children: [{ label: 'Items', value: 'items', isLeaf: true }],
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
  });

  describe('buildCascaderOptions', () => {
    it('should convert MetaTreeNode[] to CascaderOption[]', () => {
      const metaTree: MetaTreeNode[] = [
        {
          name: 'user',
          title: 'User',
          type: 'object',
          children: [
            { name: 'name', title: 'Name', type: 'string' },
            { name: 'email', title: 'Email', type: 'string' },
          ],
        },
        {
          name: 'data',
          title: 'Data',
          type: 'string',
        },
      ];

      const result = buildCascaderOptions(metaTree);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        label: 'User',
        value: 'user',
        isLeaf: false,
        meta: metaTree[0],
        children: [
          { label: 'Name', value: 'name', isLeaf: true, meta: metaTree[0].children?.[0] },
          { label: 'Email', value: 'email', isLeaf: true, meta: metaTree[0].children?.[1] },
        ],
      });
      expect(result[1]).toEqual({
        label: 'Data',
        value: 'data',
        isLeaf: true,
        meta: metaTree[1],
      });
    });

    it('should handle async children by marking as not leaf', () => {
      const metaTree: MetaTreeNode[] = [
        {
          name: 'async',
          title: 'Async Node',
          type: 'object',
          children: async () => [],
        },
      ];

      const result = buildCascaderOptions(metaTree);
      expect(result[0]).toEqual({
        label: 'Async Node',
        value: 'async',
        isLeaf: false,
        meta: metaTree[0],
      });
    });

    it('should handle invalid metaTree input', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(buildCascaderOptions(null as any)).toEqual([]);
      expect(buildCascaderOptions(undefined as any)).toEqual([]);
      expect(buildCascaderOptions({} as any)).toEqual([]);

      expect(consoleSpy).toHaveBeenCalledTimes(3);
      consoleSpy.mockRestore();
    });

    it('should handle invalid nodes in metaTree', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const metaTree: MetaTreeNode[] = [
        { name: 'valid', title: 'Valid', type: 'object' },
        null as any,
        { name: '', title: 'Empty Name', type: 'object' },
        undefined as any,
      ];

      const result = buildCascaderOptions(metaTree);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({
        label: 'Valid',
        value: 'valid',
        isLeaf: true,
        meta: { name: 'valid', title: 'Valid', type: 'object' },
      });

      // Invalid nodes should be converted to placeholder options
      expect(result[1]).toEqual({
        label: 'Invalid Node',
        value: 'invalid',
        isLeaf: true,
        meta: null,
      });

      expect(consoleSpy).toHaveBeenCalledTimes(3); // null, empty name, undefined
      consoleSpy.mockRestore();
    });

    it('should use name as fallback when title is missing', () => {
      const metaTree: MetaTreeNode[] = [
        { name: 'test', type: 'object' }, // missing title
      ];

      const result = buildCascaderOptions(metaTree);

      expect(result).toEqual([
        {
          label: 'test',
          value: 'test',
          isLeaf: true,
          meta: { name: 'test', type: 'object' },
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
      expect(converters).toHaveProperty('renderInputComponent');
      expect(converters).toHaveProperty('resolvePathFromValue');
      expect(converters).toHaveProperty('resolveValueFromPath');
      expect(typeof converters.renderInputComponent).toBe('function');
      expect(typeof converters.resolvePathFromValue).toBe('function');
      expect(typeof converters.resolveValueFromPath).toBe('function');
    });

    it('should resolve path from variable value', () => {
      const converters = createDefaultConverters();
      expect(converters.resolvePathFromValue?.('{{ ctx.user.name }}')).toEqual(['user', 'name']);
      expect(converters.resolvePathFromValue?.('static value')).toBeNull();
    });

    it('should resolve value from path and meta', () => {
      const converters = createDefaultConverters();
      const mockMeta: MetaTreeNode = {
        name: 'name',
        title: 'Name',
        type: 'string',
      };
      expect(converters.resolveValueFromPath?.(mockMeta, ['user', 'name'])).toBe('{{ ctx.user.name }}');
    });
  });

  // 新增：类型检测相关测试
  describe('detectComponentTypeFromMeta', () => {
    it('should detect component type from interface field', () => {
      const rateMeta: MetaTreeNode = {
        name: 'rating',
        title: 'Rating',
        type: 'number',
        interface: 'rate',
      };
      expect(detectComponentTypeFromMeta(rateMeta)).toBe('rate');

      const switchMeta: MetaTreeNode = {
        name: 'enabled',
        title: 'Enabled',
        type: 'boolean',
        interface: 'switch',
      };
      expect(detectComponentTypeFromMeta(switchMeta)).toBe('switch');

      const selectMeta: MetaTreeNode = {
        name: 'theme',
        title: 'Theme',
        type: 'string',
        interface: 'select',
      };
      expect(detectComponentTypeFromMeta(selectMeta)).toBe('select');

      const dateMeta: MetaTreeNode = {
        name: 'createdAt',
        title: 'Created At',
        type: 'string',
        interface: 'date',
      };
      expect(detectComponentTypeFromMeta(dateMeta)).toBe('date');

      const numberMeta: MetaTreeNode = {
        name: 'count',
        title: 'Count',
        type: 'number',
        interface: 'number',
      };
      expect(detectComponentTypeFromMeta(numberMeta)).toBe('number');
    });

    it('should fallback to type-based detection when interface is not available', () => {
      const booleanMeta: MetaTreeNode = {
        name: 'flag',
        title: 'Flag',
        type: 'boolean',
      };
      expect(detectComponentTypeFromMeta(booleanMeta)).toBe('switch');

      const numberMeta: MetaTreeNode = {
        name: 'amount',
        title: 'Amount',
        type: 'number',
      };
      expect(detectComponentTypeFromMeta(numberMeta)).toBe('number');

      const dateMeta: MetaTreeNode = {
        name: 'timestamp',
        title: 'Timestamp',
        type: 'date',
      };
      expect(detectComponentTypeFromMeta(dateMeta)).toBe('date');
    });

    it('should return null for unsupported types and interfaces', () => {
      const stringMeta: MetaTreeNode = {
        name: 'text',
        title: 'Text',
        type: 'string',
      };
      expect(detectComponentTypeFromMeta(stringMeta)).toBe(null);

      const unknownMeta: MetaTreeNode = {
        name: 'unknown',
        title: 'Unknown',
        type: 'unknown',
        interface: 'unknown',
      };
      expect(detectComponentTypeFromMeta(unknownMeta)).toBe(null);
    });

    it('should return null for null or undefined meta', () => {
      expect(detectComponentTypeFromMeta(null)).toBe(null);
      expect(detectComponentTypeFromMeta(undefined as any)).toBe(null);
    });

    it('should handle rating interface variations', () => {
      const rateMeta: MetaTreeNode = {
        name: 'score',
        title: 'Score',
        type: 'number',
        interface: 'rating',
      };
      expect(detectComponentTypeFromMeta(rateMeta)).toBe('rate');
    });

    it('should handle boolean interface variations', () => {
      const booleanMeta: MetaTreeNode = {
        name: 'active',
        title: 'Active',
        type: 'boolean',
        interface: 'boolean',
      };
      expect(detectComponentTypeFromMeta(booleanMeta)).toBe('switch');
    });

    it('should prioritize interface over type', () => {
      const meta: MetaTreeNode = {
        name: 'special',
        title: 'Special',
        type: 'string', // type suggests string
        interface: 'rate', // but interface suggests rate
      };
      expect(detectComponentTypeFromMeta(meta)).toBe('rate');
    });
  });

  describe('detectComponentTypeFromFieldName', () => {
    it('should detect rate type from field name containing rating keywords', () => {
      expect(detectComponentTypeFromFieldName('userRating')).toBe('rate');
      expect(detectComponentTypeFromFieldName('productRate')).toBe('rate');
      expect(detectComponentTypeFromFieldName('reviewScore')).toBe('rate');
      expect(detectComponentTypeFromFieldName('overallRating')).toBe('rate');
    });

    it('should detect switch type from field name containing switch keywords', () => {
      expect(detectComponentTypeFromFieldName('isEnabled')).toBe('switch');
      expect(detectComponentTypeFromFieldName('toggleValue')).toBe('switch');
      expect(detectComponentTypeFromFieldName('switchStatus')).toBe('switch');
      expect(detectComponentTypeFromFieldName('enableNotifications')).toBe('switch');
    });

    it('should detect number type from field name containing number keywords', () => {
      expect(detectComponentTypeFromFieldName('itemCount')).toBe('number');
      expect(detectComponentTypeFromFieldName('totalAmount')).toBe('number');
      expect(detectComponentTypeFromFieldName('priceNumber')).toBe('number');
      expect(detectComponentTypeFromFieldName('userCount')).toBe('number');
    });

    it('should detect date type from field name containing date keywords', () => {
      expect(detectComponentTypeFromFieldName('createdDate')).toBe('date');
      expect(detectComponentTypeFromFieldName('updatedTime')).toBe('date');
      expect(detectComponentTypeFromFieldName('birthDate')).toBe('date');
      expect(detectComponentTypeFromFieldName('eventTime')).toBe('date');
    });

    it('should detect select type from field name containing select keywords', () => {
      expect(detectComponentTypeFromFieldName('colorTheme')).toBe('select');
      expect(detectComponentTypeFromFieldName('selectedOption')).toBe('select');
      expect(detectComponentTypeFromFieldName('themePreference')).toBe('select');
      expect(detectComponentTypeFromFieldName('selectValue')).toBe('select');
    });

    it('should be case insensitive', () => {
      expect(detectComponentTypeFromFieldName('USERRATING')).toBe('rate');
      expect(detectComponentTypeFromFieldName('IsEnabled')).toBe('switch');
      expect(detectComponentTypeFromFieldName('ItemCount')).toBe('number');
      expect(detectComponentTypeFromFieldName('CreatedDate')).toBe('date');
      expect(detectComponentTypeFromFieldName('ColorTheme')).toBe('select');
    });

    it('should return null for unrecognized field names', () => {
      expect(detectComponentTypeFromFieldName('userName')).toBe(null);
      expect(detectComponentTypeFromFieldName('description')).toBe(null);
      expect(detectComponentTypeFromFieldName('id')).toBe(null);
      expect(detectComponentTypeFromFieldName('unknown')).toBe(null);
    });

    it('should handle field names with multiple matching keywords prioritizing first match', () => {
      // The implementation checks for rating first, so it should return 'rate'
      expect(detectComponentTypeFromFieldName('ratingCount')).toBe('rate');
      expect(detectComponentTypeFromFieldName('switchNumber')).toBe('switch');
    });

    it('should handle edge cases', () => {
      expect(detectComponentTypeFromFieldName('')).toBe(null);
      expect(detectComponentTypeFromFieldName('a')).toBe(null);
      expect(detectComponentTypeFromFieldName('rate')).toBe('rate'); // exact match
      expect(detectComponentTypeFromFieldName('switch')).toBe('switch'); // exact match
    });
  });
});
