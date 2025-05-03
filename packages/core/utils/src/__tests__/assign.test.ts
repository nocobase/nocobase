/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { assign } from '../assign';

describe('merge strategy', () => {
  describe('andMerge', () => {
    it('case 1', () => {
      const obj = assign(
        {},
        {
          filter: { a: 'a2' },
        },
        {
          filter: 'andMerge',
        },
      );
      expect(obj).toMatchObject({
        filter: { a: 'a2' },
      });
    });
    it('case 1-1', () => {
      const obj = assign(
        {
          filter: { a: 'a2' },
        },
        {},
        {
          filter: 'andMerge',
        },
      );
      expect(obj).toMatchObject({
        filter: { a: 'a2' },
      });
    });
    it('case 2', () => {
      const obj = assign(
        {
          filter: { a: 'a1' },
        },
        {},
        {
          filter: 'andMerge',
        },
      );
      expect(obj).toMatchObject({
        filter: { a: 'a1' },
      });
    });
    it('case 2-2', () => {
      const obj = assign(
        {},
        {
          filter: { a: 'a1' },
        },
        {
          filter: 'andMerge',
        },
      );
      expect(obj).toMatchObject({
        filter: { a: 'a1' },
      });
    });
    it('case 3', () => {
      const obj = assign(
        {
          filter: { a: 'a1' },
        },
        {
          filter: undefined,
        },
        {
          filter: 'andMerge',
        },
      );
      expect(obj).toMatchObject({
        filter: { a: 'a1' },
      });
    });
    it('case 3-2', () => {
      const obj = assign(
        {
          filter: undefined,
        },
        {
          filter: { a: 'a1' },
        },
        {
          filter: 'andMerge',
        },
      );
      expect(obj).toMatchObject({
        filter: { a: 'a1' },
      });
    });
    it('case 4', () => {
      const obj = assign(
        {
          filter: { a: 'a1' },
        },
        {
          filter: { a: 'a2' },
        },
        {
          filter: 'andMerge',
        },
      );
      expect(obj).toMatchObject({
        filter: {
          $and: [{ a: 'a1' }, { a: 'a2' }],
        },
      });
    });
  });

  describe('orMerge', () => {
    it('case 1', () => {
      const obj = assign(
        {},
        {
          filter: { a: 'a2' },
        },
        {
          filter: 'orMerge',
        },
      );
      expect(obj).toMatchObject({
        filter: { a: 'a2' },
      });
    });
    it('case 2', () => {
      const obj = assign(
        {
          filter: { a: 'a1' },
        },
        {},
        {
          filter: 'orMerge',
        },
      );
      expect(obj).toMatchObject({
        filter: { a: 'a1' },
      });
    });
    it('case 3', () => {
      const obj = assign(
        {
          filter: { a: 'a1' },
        },
        {
          filter: undefined,
        },
        {
          filter: 'orMerge',
        },
      );
      expect(obj).toMatchObject({
        filter: { a: 'a1' },
      });
    });
    it('case 1', () => {
      const obj = assign(
        {
          filter: { a: 'a2' },
        },
        {},
        {
          filter: 'orMerge',
        },
      );
      expect(obj).toMatchObject({
        filter: { a: 'a2' },
      });
    });
    it('case 2', () => {
      const obj = assign(
        {},
        {
          filter: { a: 'a1' },
        },
        {
          filter: 'orMerge',
        },
      );
      expect(obj).toMatchObject({
        filter: { a: 'a1' },
      });
    });
    it('case 3', () => {
      const obj = assign(
        {
          filter: undefined,
        },
        {
          filter: { a: 'a1' },
        },
        {
          filter: 'orMerge',
        },
      );
      expect(obj).toMatchObject({
        filter: { a: 'a1' },
      });
    });
    it('case 4', () => {
      const obj = assign(
        {
          filter: { a: 'a1' },
        },
        {
          filter: { a: 'a2' },
        },
        {
          filter: 'orMerge',
        },
      );
      expect(obj).toMatchObject({
        filter: {
          $or: [{ a: 'a1' }, { a: 'a2' }],
        },
      });
    });
  });

  describe('intersect', () => {
    it('case 1', () => {
      const obj = assign(
        {
          key1: ['val1'],
        },
        {
          key1: ['val2'],
        },
        {
          key1: 'intersect',
        },
      );
      expect(obj).toMatchObject({
        key1: [],
      });
    });
    it('case 2', () => {
      const obj = assign(
        {
          key1: ['val1'],
        },
        {},
        {
          key1: 'intersect',
        },
      );
      expect(obj).toMatchObject({
        key1: ['val1'],
      });
    });
    it('case 2', () => {
      const obj = assign(
        {},
        {
          key1: ['val1'],
        },
        {
          key1: 'intersect',
        },
      );
      expect(obj).toMatchObject({
        key1: ['val1'],
      });
    });
    it('case 3', () => {
      const obj = assign(
        {},
        {
          key1: ['val2'],
        },
        {
          key1: 'intersect',
        },
      );
      expect(obj).toMatchObject({
        key1: ['val2'],
      });
    });
    it('case 3', () => {
      const obj = assign(
        {
          key1: ['val2'],
        },
        {},
        {
          key1: 'intersect',
        },
      );
      expect(obj).toMatchObject({
        key1: ['val2'],
      });
    });
    it('case 4', () => {
      const obj = assign(
        {
          key1: 'a,b,c',
        },
        {
          key1: 'b,c,d',
        },
        {
          key1: 'intersect',
        },
      );
      expect(obj).toMatchObject({
        key1: ['b', 'c'],
      });
    });
    it('case 5', () => {
      const obj = assign(
        {
          key1: 'a,b,c',
        },
        {
          key1: ['b', 'c', 'd'],
        },
        {
          key1: 'intersect',
        },
      );
      expect(obj).toMatchObject({
        key1: ['b', 'c'],
      });
    });
  });

  describe('union', () => {
    it('case 1', () => {
      const obj = assign(
        {
          key1: ['val1'],
        },
        {
          key1: ['val2'],
        },
        {
          key1: 'union',
        },
      );
      expect(obj).toMatchObject({
        key1: ['val1', 'val2'],
      });
    });
    it('case 2', () => {
      const obj = assign(
        {},
        {
          key1: ['val1'],
        },
        {
          key1: 'union',
        },
      );
      expect(obj).toMatchObject({
        key1: ['val1'],
      });
    });
    it('case 2', () => {
      const obj = assign(
        {
          key1: ['val1'],
        },
        {},
        {
          key1: 'union',
        },
      );
      expect(obj).toMatchObject({
        key1: ['val1'],
      });
    });
    it('case 3', () => {
      const obj = assign(
        {},
        {
          key1: ['val2'],
        },
        {
          key1: 'union',
        },
      );
      expect(obj).toMatchObject({
        key1: ['val2'],
      });
    });
    it('case 3', () => {
      const obj = assign(
        {
          key1: ['val2'],
        },
        {},
        {
          key1: 'union',
        },
      );
      expect(obj).toMatchObject({
        key1: ['val2'],
      });
    });
    it('case 4', () => {
      const obj = assign(
        {
          key1: 'a,b,c',
        },
        {
          key1: 'b,c,d',
        },
        {
          key1: 'union',
        },
      );
      expect(obj).toMatchObject({
        key1: ['a', 'b', 'c', 'd'],
      });
    });
    it('case 5', () => {
      const obj = assign(
        {
          key1: 'a,b,c',
        },
        {
          key1: ['b', 'c', 'd'],
        },
        {
          key1: 'union',
        },
      );
      expect(obj).toMatchObject({
        key1: ['a', 'b', 'c', 'd'],
      });
    });
  });

  describe('function', () => {
    it('case 1', () => {
      const obj = assign(
        {
          key1: 'val1',
        },
        {
          key1: 'val2',
        },
        {
          key1: (x, y) => `${x} + ${y}`,
        },
      );
      expect(obj).toMatchObject({
        key1: 'val1 + val2',
      });
    });
    it('case 2', () => {
      const obj = assign(
        {
          filter: { a: 'a2' },
        },
        {},
        {
          filter: () => '123',
        },
      );
      expect(obj).toMatchObject({
        filter: '123',
      });
    });
    it('case 3', () => {
      const obj = assign(
        {},
        {
          filter: { a: 'a2' },
        },
        {
          filter: () => '123',
        },
      );
      expect(obj).toMatchObject({
        filter: '123',
      });
    });
  });

  describe('merge', () => {
    it('case 1', () => {
      const obj = assign(
        {
          key1: { a: 'a1' },
        },
        {
          key1: { b: 'b1' },
        },
        {
          key1: 'merge',
        },
      );
      expect(obj).toMatchObject({
        key1: { b: 'b1' },
      });
    });
  });

  describe('overwrite', () => {
    it('case 1', () => {
      const obj = assign(
        {
          key1: 'a',
        },
        {
          key1: 'b',
        },
        {
          key1: 'overwrite',
        },
      );
      expect(obj).toMatchObject({
        key1: 'b',
      });
    });
    it('case 2', () => {
      const obj = assign(
        {
          key1: 'a',
        },
        {},
        {
          key1: 'overwrite',
        },
      );
      expect(obj).toMatchObject({
        key1: 'a',
      });
    });
    it('case 3', () => {
      const obj = assign(
        {},
        {
          key1: 'a',
        },
        {
          key1: 'overwrite',
        },
      );
      expect(obj).toMatchObject({
        key1: 'a',
      });
    });
    it('case 4', () => {
      const obj = assign(
        {
          key1: 'a',
        },
        {
          key1: undefined,
        },
        {
          key1: 'overwrite',
        },
      );
      expect(obj).toMatchObject({
        key1: 'a',
      });
    });
    it('case 5', () => {
      const obj = assign(
        {
          key1: 'a',
        },
        {
          key1: null,
        },
        {
          key1: 'overwrite',
        },
      );
      expect(obj).toMatchObject({
        key1: null,
      });
    });
    it('case 6', () => {
      const obj = assign(
        {
          key1: 'a',
        },
        {
          key1: '',
        },
        {
          key1: 'overwrite',
        },
      );
      expect(obj).toMatchObject({
        key1: '',
      });
    });
    it('case 7', () => {
      const obj = assign(
        {
          key1: 'a,b,c',
        },
        {},
        {
          key1: 'overwrite',
        },
      );
      expect(obj).toMatchObject({
        key1: ['a', 'b', 'c'],
      });
    });
    it('case 8', () => {
      const obj = assign(
        {},
        {
          key1: 'a,b,c',
        },
        {
          key1: 'overwrite',
        },
      );
      expect(obj).toMatchObject({
        key1: ['a', 'b', 'c'],
      });
    });
  });

  describe('default = deepmerge', () => {
    it('case 1', () => {
      const obj = assign(
        {
          key1: 'val1',
        },
        {
          key1: 'val2',
        },
      );
      expect(obj).toMatchObject({
        key1: 'val2',
      });
    });
    it('case 2', () => {
      const obj = assign(
        {
          key1: 'val1',
        },
        {
          key1: null,
        },
      );
      expect(obj).toMatchObject({
        key1: null,
      });
    });
    it('case 3', () => {
      const obj = assign(
        {
          key1: 'val1',
        },
        {
          key1: {},
        },
      );
      expect(obj).toMatchObject({
        key1: {},
      });
    });
    it('case 3', () => {
      const obj = assign(
        {
          key1: 'val1',
        },
        {
          key1: [],
        },
      );
      expect(obj).toMatchObject({
        key1: [],
      });
    });
    it('case 4', () => {
      const obj = assign(
        {
          key1: ['val1'],
        },
        {
          key1: ['val2'],
        },
      );
      expect(obj).toMatchObject({
        key1: ['val2'],
      });
    });
    it('case 5', () => {
      const obj = assign(
        {
          key1: { a: 'a1' },
        },
        {
          key1: { b: 'b1' },
        },
      );
      expect(obj).toMatchObject({
        key1: { a: 'a1', b: 'b1' },
      });
    });
  });

  describe('source is empty', () => {
    it('case 1', () => {
      const obj = assign(
        {
          resourceName: 'uiSchemas',
          resourceIndex: 'n0jylid5rqa',
          actionName: 'getJsonSchema',
          values: {},
          sort: 'id',
          fields: ['id'],
          except: ['id'],
          whitelist: ['id1'],
          blacklist: ['id2'],
        },
        {},
        {
          filter: 'andMerge',
          fields: 'intersect',
          except: 'union',
          whitelist: 'intersect',
          blacklist: 'intersect',
          sort: 'overwrite',
        },
      );
      expect(obj).toMatchObject({
        resourceName: 'uiSchemas',
        resourceIndex: 'n0jylid5rqa',
        actionName: 'getJsonSchema',
        values: {},
        sort: 'id',
        fields: ['id'],
        except: ['id'],
        whitelist: ['id1'],
        blacklist: ['id2'],
      });
    });
  });
});
