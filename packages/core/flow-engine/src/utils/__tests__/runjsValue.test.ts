/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { extractUsedVariablePathsFromRunJS, isRunJSValue, normalizeRunJSValue } from '../runjsValue';

describe('runjsValue utils', () => {
  it('isRunJSValue: strict shape detection', () => {
    expect(isRunJSValue({ code: 'return 1' })).toBe(true);
    expect(isRunJSValue({ code: 'return 1', version: 'v1' })).toBe(true);

    expect(isRunJSValue(null)).toBe(false);
    expect(isRunJSValue('return 1')).toBe(false);
    expect(isRunJSValue({})).toBe(false);
    expect(isRunJSValue({ version: 'v1' })).toBe(false);
    expect(isRunJSValue({ code: 1 })).toBe(false);
    expect(isRunJSValue({ code: 'return 1', foo: 1 })).toBe(false);
    expect(isRunJSValue([])).toBe(false);
  });

  it('normalizeRunJSValue: defaults version to v1', () => {
    expect(normalizeRunJSValue({ code: 'return 1' })).toEqual({ code: 'return 1', version: 'v1' });
    expect(normalizeRunJSValue({ code: 'return 1', version: 'v2' })).toEqual({ code: 'return 1', version: 'v2' });
  });

  it('extractUsedVariablePathsFromRunJS: extracts ctx usage (dot + bracket root)', () => {
    const code = `
      // comment: ctx.ignore.me
      const x = "ctx.ignore.too";
      return ctx.formValues.a + ctx.record.id + ctx.someVar + ctx['user'].name;
    `;
    const out = extractUsedVariablePathsFromRunJS(code);
    expect(out.formValues).toContain('a');
    expect(out.record).toContain('id');
    expect(out.someVar).toContain('');
    expect(out.user).toContain('name');
  });
});
