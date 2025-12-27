/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { ViewItem } from '../resolveViewParamsToViewList';
import { observable } from '@nocobase/flow-engine';
import { getKey } from '../getViewDiffAndUpdateHidden';

const createViewItem = (params: any, index = 0): ViewItem => {
  return {
    params,
    index,
    hidden: observable.ref(false),
  } as any;
};

describe('getKey', () => {
  it('is stable for objects regardless of key order', () => {
    const a = createViewItem({ viewUid: 'v', sourceId: { b: 2, a: 1 } }, 0);
    const b = createViewItem({ viewUid: 'v', sourceId: { a: 1, b: 2 } }, 0);

    expect(getKey(a)).toBe(getKey(b));
  });

  it('distinguishes different indices', () => {
    const a = createViewItem({ viewUid: 'v', sourceId: 's' }, 0);
    const b = createViewItem({ viewUid: 'v', sourceId: 's' }, 1);

    expect(getKey(a)).not.toBe(getKey(b));
  });

  it('handles arrays and nested objects consistently', () => {
    const params1 = { viewUid: 'v', filterByTk: { a: [2, 1], b: { y: 2, x: 1 } } };
    const params2 = { viewUid: 'v', filterByTk: { b: { x: 1, y: 2 }, a: [2, 1] } };

    const a = createViewItem(params1, 2);
    const b = createViewItem(params2, 2);

    expect(getKey(a)).toBe(getKey(b));
  });

  it('treats null and undefined as empty string for parts', () => {
    const a = createViewItem({ viewUid: null, sourceId: undefined, filterByTk: undefined }, 0);
    const b = createViewItem({}, 0);

    expect(getKey(a)).toBe(getKey(b));
  });

  it('produces different keys for different primitive values', () => {
    const a = createViewItem({ viewUid: 'v1', sourceId: 's' }, 0);
    const b = createViewItem({ viewUid: 'v2', sourceId: 's' }, 0);

    expect(getKey(a)).not.toBe(getKey(b));
  });
});
