/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema } from '@formily/json-schema';
import { renderHook } from '@nocobase/test/client';
import { describe, expect, it } from 'vitest';
import { useHasUsedVariable } from '../hooks/useSpecialCase';

describe('useHasUsedVariable', () => {
  it('should return true when FormItem has variable in default value', () => {
    const schema = new Schema({
      type: 'object',
      properties: {
        field1: {
          type: 'string',
          'x-decorator': 'FormItem',
          default: '{{$context.field1}}',
        },
      },
    });

    const { result } = renderHook(() => useHasUsedVariable());
    const { hasUsedVariable } = result.current;
    expect(hasUsedVariable('$context', schema)).toBe(true);
  });

  it('should return false when FormItem has no variable', () => {
    const schema = new Schema({
      type: 'object',
      properties: {
        field1: {
          type: 'string',
          'x-decorator': 'FormItem',
          default: 'static value',
        },
      },
    });

    const { result } = renderHook(() => useHasUsedVariable());
    const { hasUsedVariable } = result.current;
    expect(hasUsedVariable('$context', schema)).toBe(false);
  });

  it('should return true when nested FormItem has variable', () => {
    const schema = new Schema({
      type: 'object',
      properties: {
        parent: {
          type: 'object',
          properties: {
            child: {
              type: 'string',
              'x-decorator': 'FormItem',
              default: '{{$context.child}}',
            },
          },
        },
      },
    });

    const { result } = renderHook(() => useHasUsedVariable());
    const { hasUsedVariable } = result.current;
    expect(hasUsedVariable('$context', schema)).toBe(true);
  });

  it('should return false when schema has no FormItem decorator', () => {
    const schema = new Schema({
      type: 'object',
      properties: {
        field1: {
          type: 'string',
          default: '{{$context.field1}}',
        },
      },
    });

    const { result } = renderHook(() => useHasUsedVariable());
    const { hasUsedVariable } = result.current;
    expect(hasUsedVariable('$context', schema)).toBe(false);
  });

  it('should return false when default value is not a string', () => {
    const schema = new Schema({
      type: 'object',
      properties: {
        field1: {
          type: 'string',
          'x-decorator': 'FormItem',
          default: 123,
        },
      },
    });

    const { result } = renderHook(() => useHasUsedVariable());
    const { hasUsedVariable } = result.current;
    expect(hasUsedVariable('$context', schema)).toBe(false);
  });

  it('should return false when default value is not a variable', () => {
    const schema = new Schema({
      type: 'object',
      properties: {
        field1: {
          type: 'string',
          'x-decorator': 'FormItem',
          default: '$context.field1',
        },
      },
    });

    const { result } = renderHook(() => useHasUsedVariable());
    const { hasUsedVariable } = result.current;
    expect(hasUsedVariable('$context', schema)).toBe(false);
  });
});
