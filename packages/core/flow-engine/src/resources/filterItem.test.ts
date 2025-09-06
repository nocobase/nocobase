/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { FilterGroup, FilterItem } from './filterItem';

describe('FilterItem', () => {
  describe('constructor', () => {
    it('should create FilterItem with simple options', () => {
      const options = { key: 'status', value: 'active' };
      const filterItem = new FilterItem(options);
      expect(filterItem).toBeInstanceOf(FilterItem);
    });

    it('should create FilterItem with operator', () => {
      const options = { key: 'age', value: 18, operator: '$gt' };
      const filterItem = new FilterItem(options);
      expect(filterItem).toBeInstanceOf(FilterItem);
    });

    it('should return existing FilterItem when passed as argument', () => {
      const original = new FilterItem({ key: 'test', value: 'value' });
      const result = new FilterItem(original as any);
      expect(result).toBe(original);
    });
  });

  describe('toJSON', () => {
    it('should return simple key-value object without operator', () => {
      const filterItem = new FilterItem({ key: 'status', value: 'active' });
      const result = filterItem.toJSON();
      expect(result).toEqual({ status: 'active' });
    });

    it('should return operator-based object with operator', () => {
      const filterItem = new FilterItem({ key: 'age', value: 18, operator: '$gt' });
      const result = filterItem.toJSON();
      expect(result).toEqual({ age: { $gt: 18 } });
    });

    it('should handle different operators', () => {
      const operators = ['$lt', '$gte', '$lte', '$ne', '$in', '$nin'];
      operators.forEach((operator) => {
        const filterItem = new FilterItem({ key: 'field', value: 'value', operator });
        const result = filterItem.toJSON();
        expect(result).toEqual({ field: { [operator]: 'value' } });
      });
    });

    it('should handle different value types', () => {
      const testCases = [
        { value: 'string', expected: 'string' },
        { value: 123, expected: 123 },
        { value: true, expected: true },
        { value: null, expected: null },
        { value: ['a', 'b'], expected: ['a', 'b'] },
        { value: { nested: 'object' }, expected: { nested: 'object' } },
      ];

      testCases.forEach(({ value, expected }) => {
        const filterItem = new FilterItem({ key: 'field', value });
        const result = filterItem.toJSON();
        expect(result).toEqual({ field: expected });
      });
    });
  });
});

describe('FilterGroup', () => {
  describe('constructor', () => {
    it('should create FilterGroup with $and logic', () => {
      const options = {
        logic: '$and' as const,
        items: [
          { key: 'status', value: 'active' },
          { key: 'age', value: 18, operator: '$gt' },
        ],
      };
      const filterGroup = new FilterGroup(options);
      expect(filterGroup).toBeInstanceOf(FilterGroup);
    });

    it('should create FilterGroup with $or logic', () => {
      const options = {
        logic: '$or' as const,
        items: [
          { key: 'status', value: 'active' },
          { key: 'status', value: 'pending' },
        ],
      };
      const filterGroup = new FilterGroup(options);
      expect(filterGroup).toBeInstanceOf(FilterGroup);
    });

    it('should return existing FilterGroup when passed as argument', () => {
      const original = new FilterGroup({
        logic: '$and',
        items: [{ key: 'test', value: 'value' }],
      });
      const result = new FilterGroup(original as any);
      expect(result).toBe(original);
    });

    it('should throw error for invalid logic', () => {
      expect(() => {
        new FilterGroup({
          logic: '$invalid' as any,
          items: [],
        });
      }).toThrow('Logic must be either $and or $or');
    });

    it('should throw error for non-array items', () => {
      expect(() => {
        new FilterGroup({
          logic: '$and',
          items: 'not-an-array' as any,
        });
      }).toThrow('Items must be an array');
    });

    it('should handle nested FilterGroups', () => {
      const options = {
        logic: '$and' as const,
        items: [
          { key: 'status', value: 'active' },
          {
            logic: '$or' as const,
            items: [
              { key: 'age', value: 18, operator: '$gt' },
              { key: 'age', value: 65, operator: '$lt' },
            ],
          },
        ],
      };
      const filterGroup = new FilterGroup(options);
      expect(filterGroup).toBeInstanceOf(FilterGroup);
    });

    it('should handle mixed FilterItem and FilterGroup instances', () => {
      const filterItem = new FilterItem({ key: 'status', value: 'active' });
      const filterGroup = new FilterGroup({
        logic: '$or',
        items: [{ key: 'type', value: 'user' }],
      });

      const options = {
        logic: '$and' as const,
        items: [filterItem, filterGroup],
      };
      const result = new FilterGroup(options);
      expect(result).toBeInstanceOf(FilterGroup);
    });
  });

  describe('toJSON', () => {
    it('should return correct structure for $and logic', () => {
      const filterGroup = new FilterGroup({
        logic: '$and',
        items: [
          { key: 'status', value: 'active' },
          { key: 'age', value: 18, operator: '$gt' },
        ],
      });
      const result = filterGroup.toJSON();
      expect(result).toEqual({
        $and: [{ status: 'active' }, { age: { $gt: 18 } }],
      });
    });

    it('should return correct structure for $or logic', () => {
      const filterGroup = new FilterGroup({
        logic: '$or',
        items: [
          { key: 'status', value: 'active' },
          { key: 'status', value: 'pending' },
        ],
      });
      const result = filterGroup.toJSON();
      expect(result).toEqual({
        $or: [{ status: 'active' }, { status: 'pending' }],
      });
    });

    it('should handle nested FilterGroups correctly', () => {
      const filterGroup = new FilterGroup({
        logic: '$and',
        items: [
          { key: 'status', value: 'active' },
          {
            logic: '$or',
            items: [
              { key: 'age', value: 18, operator: '$gt' },
              { key: 'age', value: 65, operator: '$lt' },
            ],
          },
        ],
      });
      const result = filterGroup.toJSON();
      expect(result).toEqual({
        $and: [
          { status: 'active' },
          {
            $or: [{ age: { $gt: 18 } }, { age: { $lt: 65 } }],
          },
        ],
      });
    });

    it('should handle empty items array', () => {
      const filterGroup = new FilterGroup({
        logic: '$and',
        items: [],
      });
      const result = filterGroup.toJSON();
      expect(result).toEqual({
        $and: [],
      });
    });

    it('should handle complex nested structure', () => {
      const filterGroup = new FilterGroup({
        logic: '$or',
        items: [
          {
            logic: '$and',
            items: [
              { key: 'category', value: 'electronics' },
              { key: 'price', value: 100, operator: '$lt' },
            ],
          },
          {
            logic: '$and',
            items: [
              { key: 'category', value: 'books' },
              { key: 'rating', value: 4, operator: '$gte' },
            ],
          },
        ],
      });
      const result = filterGroup.toJSON();
      expect(result).toEqual({
        $or: [
          {
            $and: [{ category: 'electronics' }, { price: { $lt: 100 } }],
          },
          {
            $and: [{ category: 'books' }, { rating: { $gte: 4 } }],
          },
        ],
      });
    });
  });
});
