/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { pruneFilter } from '../pruneFilter';

describe('pruneFilter', () => {
  it('keeps boolean false and number 0', () => {
    const input = { a: { $eq: false }, b: { $eq: 0 } };
    const out = pruneFilter(input);
    expect(out).toEqual(input);
  });

  it('removes null/undefined/empty string and empty containers', () => {
    const input = { a: null, b: undefined, c: '', d: [], e: {} } as any;
    const out = pruneFilter(input);
    expect(out).toBeUndefined();
  });

  it('works recursively with nested objects/arrays', () => {
    const input = {
      $and: [{ isRead: { $eq: false } }, { name: { $eq: '' } }, {}, [], { nested: { empty: {}, ok: 1 } }],
    } as any;
    const out = pruneFilter(input);
    expect(out).toEqual({ $and: [{ isRead: { $eq: false } }, { nested: { ok: 1 } }] });
  });

  it('returns undefined for empty arrays/objects produced by pruning', () => {
    expect(pruneFilter([null, undefined, '', [], {}] as any)).toBeUndefined();
    expect(pruneFilter({ a: { b: '' } } as any)).toBeUndefined();
  });
});
