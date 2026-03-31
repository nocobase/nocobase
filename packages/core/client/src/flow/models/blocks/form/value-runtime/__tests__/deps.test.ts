/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { createFormValuesProxy } from '../deps';

describe('createFormValuesProxy', () => {
  it('does not proxy Date values (keeps Date prototype methods working)', () => {
    const date = new Date('2025-01-01T00:00:00.000Z');
    const valuesMirror = { a: date };

    const proxy = createFormValuesProxy({
      valuesMirror,
      basePath: [],
      getFormValuesSnapshot: () => valuesMirror,
      getFormValueAtPath: () => undefined,
    });

    expect(proxy.a).toBe(date);
    expect(() => proxy.a.getTime()).not.toThrow();
  });
});
