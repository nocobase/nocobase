/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { parseErrorLineColumn } from '../errorHelpers';

describe('errorHelpers.parseErrorLineColumn', () => {
  it('parses <anonymous>:line:column format', () => {
    const err = { stack: '<anonymous>:10:5\n at some fn' } as any;
    const pos = parseErrorLineColumn(err);
    expect(pos).toEqual({ line: 10, column: 5 });
  });

  it('parses generic :line:column format', () => {
    const err = { stack: 'Error: boom\n   at dev.js:123:9' } as any;
    const pos = parseErrorLineColumn(err);
    expect(pos).toEqual({ line: 123, column: 9 });
  });

  it('parses (line X, column Y) in message', () => {
    const err = { message: 'SyntaxError (line 7, column 12)' } as any;
    const pos = parseErrorLineColumn(err);
    expect(pos).toEqual({ line: 7, column: 12 });
  });

  it('returns null when not found', () => {
    const err = { message: 'no line info here' } as any;
    const pos = parseErrorLineColumn(err);
    expect(pos).toBeNull();
  });
});
