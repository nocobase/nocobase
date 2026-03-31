/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getDetailsItemValue, getValueWithIndex } from '../DetailsItemModel';

describe('DetailsItemModel value resolving', () => {
  it('reads nested list item from record with index chain', () => {
    expect(
      getValueWithIndex(
        {
          users: [{ profile: { nickname: 'A' } }],
        },
        'users.profile.nickname',
        ['users:0'],
      ),
    ).toBe('A');
  });

  it('falls back to currentObject with relative field path in sub-detail rows', () => {
    expect(
      getDetailsItemValue({
        record: { unrelated: true },
        currentObject: { nickname: 'B' },
        fieldPath: 'users.nickname',
        prefixFieldPath: 'users',
        idx: ['users:0'],
      }),
    ).toBe('B');
  });

  it('returns currentObject itself when field path equals prefix field path', () => {
    const currentObject = { id: 1, nickname: 'C' };
    expect(
      getDetailsItemValue({
        record: {},
        currentObject,
        fieldPath: 'users',
        prefixFieldPath: 'users',
      }),
    ).toBe(currentObject);
  });
});
