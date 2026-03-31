/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { extractPropertyPath, formatPathToVariable, isVariableExpression } from '../context';
import { FlowContext } from '../../flowContext';

describe('Context Utils', () => {
  describe('extractPropertyPath', () => {
    it('should extract property path from valid variable expressions', () => {
      expect(extractPropertyPath('{{ ctx.user.name }}')).toEqual(['user', 'name']);
      expect(extractPropertyPath('{{ctx.data.items.0.title}}')).toEqual(['data', 'items', '0', 'title']);
      expect(extractPropertyPath('{{ ctx.profile }}')).toEqual(['profile']);
    });

    it('should handle root context expressions', () => {
      expect(extractPropertyPath('{{ ctx }}')).toEqual([]);
      expect(extractPropertyPath('{{ctx}}')).toEqual([]);
    });

    it('should handle whitespace variations', () => {
      expect(extractPropertyPath('{{  ctx.user.name  }}')).toEqual(['user', 'name']);
      expect(extractPropertyPath('{{ ctx.user.name}}')).toEqual(['user', 'name']);
      expect(extractPropertyPath('{{ctx.user.name }}')).toEqual(['user', 'name']);
    });

    it('should return null for invalid formats', () => {
      expect(extractPropertyPath('user')).toBeNull();
      expect(extractPropertyPath('ctx.user')).toBeNull();
      expect(extractPropertyPath('{{user}}')).toBeNull();
      expect(extractPropertyPath('{{ user }}')).toBeNull();
      expect(extractPropertyPath('invalid format')).toBeNull();
      expect(extractPropertyPath('{{ ctx.user')).toBeNull();
      expect(extractPropertyPath('ctx.user }}')).toBeNull();
    });

    it('should return null for non-string values', () => {
      expect(extractPropertyPath(123 as any)).toBeNull();
      expect(extractPropertyPath(null as any)).toBeNull();
      expect(extractPropertyPath(undefined as any)).toBeNull();
      expect(extractPropertyPath({} as any)).toBeNull();
    });
  });

  describe('formatPathToVariable', () => {
    it('should format path array to variable expression', () => {
      expect(formatPathToVariable(['user', 'name'])).toBe('{{ ctx.user.name }}');
      expect(formatPathToVariable(['data', 'items', '0', 'title'])).toBe('{{ ctx.data.items.0.title }}');
      expect(formatPathToVariable(['profile'])).toBe('{{ ctx.profile }}');
    });

    it('should handle empty path', () => {
      expect(formatPathToVariable([])).toBe('{{ ctx }}');
    });
  });

  describe('isVariableExpression', () => {
    it('should detect valid variable expressions', () => {
      expect(isVariableExpression('{{ ctx.user.name }}')).toBe(true);
      expect(isVariableExpression('{{ctx.data}}')).toBe(true);
      expect(isVariableExpression('{{ ctx.items.0.title }}')).toBe(true);
      expect(isVariableExpression('{{ ctx }}')).toBe(true);
      expect(isVariableExpression('{{ctx}}')).toBe(true);
    });

    it('should return false for non-variable expressions', () => {
      expect(isVariableExpression('plain text')).toBe(false);
      expect(isVariableExpression('123')).toBe(false);
      expect(isVariableExpression('')).toBe(false);
      expect(isVariableExpression('user')).toBe(false);
      expect(isVariableExpression('ctx.user')).toBe(false);
      expect(isVariableExpression('{{user}}')).toBe(false);
      expect(isVariableExpression('{{ user }}')).toBe(false);
      expect(isVariableExpression('{ctx.user}')).toBe(false);
      expect(isVariableExpression('{{ ctx.user')).toBe(false);
      expect(isVariableExpression('ctx.user }}')).toBe(false);
    });

    it('should handle non-string values', () => {
      expect(isVariableExpression(null)).toBe(false);
      expect(isVariableExpression(undefined)).toBe(false);
      expect(isVariableExpression(123)).toBe(false);
      expect(isVariableExpression({ key: 'value' })).toBe(false);
      expect(isVariableExpression([])).toBe(false);
    });
  });
});
