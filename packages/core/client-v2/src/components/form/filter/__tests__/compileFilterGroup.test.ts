/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { compileFilterGroup } from '../useFilterActionProps';

describe('compileFilterGroup', () => {
  it('returns undefined for an empty group so callers can drop the filter param', () => {
    expect(compileFilterGroup(undefined)).toBeUndefined();
    expect(compileFilterGroup({ logic: '$and', items: [] })).toBeUndefined();
  });

  it('compiles a single condition into the NocoBase {path: {op: val}} envelope', () => {
    const out = compileFilterGroup({
      logic: '$and',
      items: [{ path: 'lockReason', operator: '$includes', value: 'abuse' }],
    });
    expect(out).toEqual({ $and: [{ lockReason: { $includes: 'abuse' } }] });
  });

  it('preserves the parent logic ($and / $or)', () => {
    const out = compileFilterGroup({
      logic: '$or',
      items: [
        { path: 'lockReason', operator: '$eq', value: 'abuse' },
        { path: 'lockReason', operator: '$eq', value: 'spam' },
      ],
    });
    expect(out).toEqual({
      $or: [{ lockReason: { $eq: 'abuse' } }, { lockReason: { $eq: 'spam' } }],
    });
  });

  it('compiles nested groups recursively', () => {
    const out = compileFilterGroup({
      logic: '$and',
      items: [
        { path: 'lockReason', operator: '$eq', value: 'abuse' },
        {
          logic: '$or',
          items: [
            { path: 'lockedTs', operator: '$dateAfter', value: '2026-01-01' },
            { path: 'lockedTs', operator: '$dateBefore', value: '2026-12-31' },
          ],
        },
      ],
    });
    expect(out).toEqual({
      $and: [
        { lockReason: { $eq: 'abuse' } },
        {
          $or: [{ lockedTs: { $dateAfter: '2026-01-01' } }, { lockedTs: { $dateBefore: '2026-12-31' } }],
        },
      ],
    });
  });

  it('drops items with empty values (undefined / "" / [] / {}) so half-edited rows do not 500 the server', () => {
    // Mirrors v1's `removeNullCondition` behaviour. A user who selected a field + operator but hasn't typed a value yet must NOT cause `{path:{operator:undefined}}` to fly out — the server rejects empty operator bodies on `$dateOn` etc.
    const out = compileFilterGroup({
      logic: '$and',
      items: [
        { path: 'lockedTs', operator: '$dateOn', value: undefined },
        { path: 'lockReason', operator: '$eq', value: '' },
        { path: 'lockReason', operator: '$in', value: [] },
        { path: 'lockedTs', operator: '$dateOn', value: {} },
        { path: 'lockReason', operator: '$eq', value: 'kept' },
      ],
    });
    expect(out).toEqual({ $and: [{ lockReason: { $eq: 'kept' } }] });
  });

  it('expands dotted association paths into nested objects (matches v1 payload shape)', () => {
    // `user.createdBy.password` must reach the server as a nested object so the filter resolver walks the association chain. Flattened-key form (`{ "user.createdBy.password": ... }`) leaves the server treating the whole string as one column name.
    const out = compileFilterGroup({
      logic: '$and',
      items: [{ path: 'user.createdBy.password', operator: '$includes', value: '123' }],
    });
    expect(out).toEqual({
      $and: [{ user: { createdBy: { password: { $includes: '123' } } } }],
    });
  });

  it('keeps relative date descriptors (non-empty plain objects) intact', () => {
    // `{ type: 'today' }` is an empty-keys-only check away from being pruned by accident. Confirm it survives — that's the server-readable shape for relative-date filters.
    const out = compileFilterGroup({
      logic: '$and',
      items: [{ path: 'lockedTs', operator: '$dateOn', value: { type: 'today' } }],
    });
    expect(out).toEqual({ $and: [{ lockedTs: { $dateOn: { type: 'today' } } }] });
  });

  it('drops items missing path or operator so half-typed rows do not break the query', () => {
    const out = compileFilterGroup({
      logic: '$and',
      items: [
        { path: '', operator: '$eq', value: 'orphan' },
        { path: 'lockReason', operator: '', value: 'orphan' },
        { path: 'lockReason', operator: '$eq', value: 'kept' },
      ],
    });
    expect(out).toEqual({ $and: [{ lockReason: { $eq: 'kept' } }] });
  });

  it('drops empty nested groups so a half-built sub-group does not produce { $or: [] }', () => {
    const out = compileFilterGroup({
      logic: '$and',
      items: [
        { path: 'lockReason', operator: '$eq', value: 'abuse' },
        { logic: '$or', items: [] },
      ],
    });
    expect(out).toEqual({ $and: [{ lockReason: { $eq: 'abuse' } }] });
  });

  it('returns undefined when every item drops out', () => {
    const out = compileFilterGroup({
      logic: '$and',
      items: [
        { path: '', operator: '', value: '' },
        { logic: '$or', items: [] },
      ],
    });
    expect(out).toBeUndefined();
  });

  it('passes complex value shapes (date descriptors, arrays) through unchanged', () => {
    const dateDescriptor = { type: 'past', number: 3, unit: 'day' };
    const out = compileFilterGroup({
      logic: '$and',
      items: [
        { path: 'lockedTs', operator: '$dateOn', value: dateDescriptor },
        { path: 'lockReason', operator: '$in', value: ['abuse', 'spam'] },
      ],
    });
    expect(out).toEqual({
      $and: [{ lockedTs: { $dateOn: dateDescriptor } }, { lockReason: { $in: ['abuse', 'spam'] } }],
    });
  });
});
