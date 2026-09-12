/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { formatResultForDisplay } from '../formatResultForDisplay';

describe('formatResultForDisplay', () => {
  it('matches v1 Input.JSON behavior for a numeric-looking string result', () => {
    expect(formatResultForDisplay('1234')).toBe('1234');
  });

  it('keeps raw JSON-looking string text unchanged', () => {
    expect(formatResultForDisplay('{"a":1}')).toBe('{"a":1}');
  });

  it('quotes a plain non-JSON string', () => {
    expect(formatResultForDisplay('hello')).toBe('"hello"');
  });

  it('pretty-prints objects', () => {
    expect(formatResultForDisplay({ a: 1 })).toBe('{\n  "a": 1\n}');
  });

  it('returns empty string for nullish values', () => {
    expect(formatResultForDisplay(null)).toBe('');
    expect(formatResultForDisplay(undefined)).toBe('');
  });
});
