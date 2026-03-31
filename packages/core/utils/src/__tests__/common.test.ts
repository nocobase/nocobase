/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { hasEmptyValue, sortTree } from '../client';

describe('hasEmptyValue', () => {
  it('should return false when there is no empty value', () => {
    const obj = {
      a: 1,
      b: 'hello',
      c: [1, 2, 3],
      d: {
        e: 'world',
        f: [4, 5, 6],
        g: {
          h: 'foo',
          i: 'bar',
        },
      },
    };
    expect(hasEmptyValue(obj)).toBe(false);
  });

  it('should return true when there is an empty value in an object', () => {
    const obj = {
      a: 1,
      b: '',
      c: [1, 2, 3],
      d: {
        e: 'world',
        f: [4, 5, 6],
        g: {
          h: 'foo',
          i: null,
        },
      },
    };
    expect(hasEmptyValue(obj)).toBe(true);
  });

  it('should return true when there is an empty value in an array', () => {
    const arr = [1, '', 3, [4, 5, 6], { a: 'foo', b: null }];
    expect(hasEmptyValue(arr)).toBe(true);
  });

  it('should return true when there is an empty value in an array and an object', () => {
    const obj = {
      a: 1,
      b: '',
      c: [1, 2, 3],
      d: {
        e: 'world',
        f: [4, 5, 6],
        g: {
          h: 'foo',
          i: null,
        },
      },
      h: [1, '', 3, [4, 5, 6], { a: 'foo', b: null }],
    };
    expect(hasEmptyValue(obj)).toBe(true);
  });

  it('should return false when the input is an empty object', () => {
    expect(hasEmptyValue({})).toBe(true);
  });

  it('should return false when the input is an empty array', () => {
    expect(hasEmptyValue([])).toBe(true);
  });

  it('should return true when the input is an object with an empty value', () => {
    const obj = { $and: [{ f_rto697s6udb: { $dateOn: null } }] };
    expect(hasEmptyValue(obj)).toBe(true);
  });
});

describe('sortTree', () => {
  it('should return the original tree when tree is empty', () => {
    expect(sortTree(null, 'order')).toBeNull();
    expect(sortTree([], 'order')).toEqual([]);
  });

  it('should sort tree nodes by a specific field in ascending order', () => {
    const tree = [
      { id: 3, name: 'C', children: [] },
      { id: 1, name: 'A', children: [] },
      { id: 2, name: 'B', children: [] },
    ];

    const result = sortTree(tree, 'id');

    expect(result).toEqual([
      { id: 1, name: 'A', children: [] },
      { id: 2, name: 'B', children: [] },
      { id: 3, name: 'C', children: [] },
    ]);
  });

  it('should sort tree nodes by a specific field in descending order', () => {
    const tree = [
      { id: 1, name: 'A', children: [] },
      { id: 3, name: 'C', children: [] },
      { id: 2, name: 'B', children: [] },
    ];

    const result = sortTree(tree, 'id', 'children', false);

    expect(result).toEqual([
      { id: 3, name: 'C', children: [] },
      { id: 2, name: 'B', children: [] },
      { id: 1, name: 'A', children: [] },
    ]);
  });

  it('should sort tree nodes with nested children', () => {
    const tree = [
      {
        id: 3,
        name: 'C',
        items: [
          { id: 2, name: 'C-2' },
          { id: 1, name: 'C-1' },
        ],
      },
      { id: 1, name: 'A', items: [] },
      {
        id: 2,
        name: 'B',
        items: [
          { id: 3, name: 'B-3' },
          { id: 1, name: 'B-1' },
        ],
      },
    ];

    const result = sortTree(tree, 'id', 'items');

    expect(result).toEqual([
      { id: 1, name: 'A', items: [] },
      {
        id: 2,
        name: 'B',
        items: [
          { id: 1, name: 'B-1' },
          { id: 3, name: 'B-3' },
        ],
      },
      {
        id: 3,
        name: 'C',
        items: [
          { id: 1, name: 'C-1' },
          { id: 2, name: 'C-2' },
        ],
      },
    ]);
  });

  it('should support sorting by function', () => {
    const tree = [
      { id: 3, name: 'C', children: [] },
      { id: 1, name: 'A', children: [] },
      { id: 2, name: 'B', children: [] },
    ];

    const sortByName = (node) => node.name;
    const result = sortTree(tree, sortByName);

    expect(result).toEqual([
      { id: 1, name: 'A', children: [] },
      { id: 2, name: 'B', children: [] },
      { id: 3, name: 'C', children: [] },
    ]);
  });

  it('should handle complex nested structures', () => {
    const tree = [
      {
        id: 2,
        name: 'B',
        children: [
          {
            id: 3,
            name: 'B-3',
            children: [
              { id: 2, name: 'B-3-2' },
              { id: 1, name: 'B-3-1' },
            ],
          },
          { id: 1, name: 'B-1', children: [] },
        ],
      },
      { id: 3, name: 'C', children: [] },
      { id: 1, name: 'A', children: [] },
    ];

    const result = sortTree(tree, 'id');

    expect(result).toEqual([
      { id: 1, name: 'A', children: [] },
      {
        id: 2,
        name: 'B',
        children: [
          { id: 1, name: 'B-1', children: [] },
          {
            id: 3,
            name: 'B-3',
            children: [
              { id: 1, name: 'B-3-1' },
              { id: 2, name: 'B-3-2' },
            ],
          },
        ],
      },
      { id: 3, name: 'C', children: [] },
    ]);
  });
});
