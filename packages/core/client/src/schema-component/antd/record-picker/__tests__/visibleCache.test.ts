/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  getRecordPickerVisibleCacheKey,
  getRecordPickerVisibleFromCache,
  setRecordPickerVisibleToCache,
} from '../visibleCache';

describe('record picker visible cache', () => {
  test('should prefer field path as cache key', () => {
    const key = getRecordPickerVisibleCacheKey(
      {
        path: {
          entire: 'users.0.staff',
        },
        address: {
          toString: () => 'users.0.staff',
        },
      },
      {
        'x-uid': 'uid-1',
        name: 'staff',
      },
    );

    expect(key).toBe('users.0.staff');
  });

  test('should fallback to field address, schema uid and name', () => {
    expect(getRecordPickerVisibleCacheKey({ address: { toString: () => 'users.1.staff' } }, {})).toBe('users.1.staff');
    expect(getRecordPickerVisibleCacheKey({}, { 'x-uid': 'uid-2', name: 'staff' })).toBe('uid-2');
    expect(getRecordPickerVisibleCacheKey({}, { name: 'staff' })).toBe('staff');
  });

  test('should save and clear visible state', () => {
    const key = 'record-picker-visible-cache-key';

    setRecordPickerVisibleToCache(key, true);
    expect(getRecordPickerVisibleFromCache(key)).toBe(true);

    setRecordPickerVisibleToCache(key, false);
    expect(getRecordPickerVisibleFromCache(key)).toBe(false);
  });
});
