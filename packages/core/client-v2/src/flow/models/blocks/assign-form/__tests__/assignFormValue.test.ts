/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { isArrayValueField, normalizeAssignFormValue } from '../assignFormValue';

describe('assignFormValue', () => {
  it('detects array-valued fields', () => {
    expect(isArrayValueField({ interface: 'multipleSelect' })).toBe(true);
    expect(isArrayValueField({ interface: 'checkboxGroup' })).toBe(true);
    expect(isArrayValueField({ uiSchema: { type: 'array' } })).toBe(true);
    expect(isArrayValueField({ interface: 'select', uiSchema: { type: 'string' } })).toBe(false);
    expect(isArrayValueField(undefined)).toBe(false);
  });

  it('wraps scalar constants for array fields', () => {
    expect(normalizeAssignFormValue('a', true)).toEqual(['a']);
    expect(normalizeAssignFormValue(0, true)).toEqual([0]);
    expect(normalizeAssignFormValue(false, true)).toEqual([false]);
    expect(normalizeAssignFormValue(['a', 'b'], true)).toEqual(['a', 'b']);
  });

  it('keeps non-constant and empty values unchanged', () => {
    expect(normalizeAssignFormValue('', true)).toEqual([]);
    expect(normalizeAssignFormValue(null, true)).toBeNull();
    expect(normalizeAssignFormValue(undefined, true)).toBeUndefined();
    expect(normalizeAssignFormValue('{{ ctx.record.name }}', true)).toBe('{{ ctx.record.name }}');
    expect(normalizeAssignFormValue({ code: 'return 1;' }, true)).toEqual({ code: 'return 1;' });
  });

  it('does not touch non-array fields', () => {
    expect(normalizeAssignFormValue('a', false)).toBe('a');
    expect(normalizeAssignFormValue(['a'], false)).toEqual(['a']);
  });
});
