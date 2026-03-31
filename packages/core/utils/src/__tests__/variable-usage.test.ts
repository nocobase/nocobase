/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { extractUsedVariableNames, extractUsedVariablePaths, type JSONValue } from '../variable-usage';

describe('variable-usage utils', () => {
  describe('extractUsedVariableNames', () => {
    it('should collect top-level ctx variables via dot and bracket notation', () => {
      const tpl: JSONValue = {
        a: '{{ ctx.user.id }}',
        b: '{{ ctx["record"].name }}',
        c: 'mixed {{ ctx.view.record.id }} and {{ ctx.twice(21) }}',
      };
      const names = extractUsedVariableNames(tpl);
      expect(names.has('user')).toBe(true);
      expect(names.has('record')).toBe(true);
      expect(names.has('view')).toBe(true);
      expect(names.has('twice')).toBe(true);
      expect(names.has('notExist')).toBe(false);
    });

    it('should handle arrays and nested objects', () => {
      const tpl: JSONValue = [
        '{{ ctx.alpha }}',
        { x: '{{ ctx.beta.gamma }}' },
        'text',
        { y: ['{{ ctx.delta[0].name }}'] },
      ];
      const names = extractUsedVariableNames(tpl);
      expect(names.has('alpha')).toBe(true);
      expect(names.has('beta')).toBe(true);
      expect(names.has('delta')).toBe(true);
    });
  });

  describe('extractUsedVariablePaths', () => {
    it('should extract simple dot paths', () => {
      const tpl: JSONValue = { a: '{{ ctx.user.id }}' };
      const usage = extractUsedVariablePaths(tpl);
      expect(usage.user).toEqual(['id']);
    });

    it('should normalize bracket first segment and keep numeric indices', () => {
      const tpl: JSONValue = {
        u: '{{ ctx["user"].roles[0].name }}',
        d: '{{ ctx.data.items.0.title }}',
      };
      const usage = extractUsedVariablePaths(tpl);
      expect(usage.user).toEqual(['roles[0].name']);
      expect(usage.data).toEqual(['items.0.title']);
    });

    it('should include subpath from nested top-level variables', () => {
      const tpl: JSONValue = '{{ ctx.view.record.id }}';
      const usage = extractUsedVariablePaths(tpl);
      expect(usage.view).toEqual(['record.id']);
    });

    it('should record empty path for method call to trigger attach', () => {
      const tpl: JSONValue = { v: '{{ ctx.twice(21) }}' };
      const usage = extractUsedVariablePaths(tpl);
      expect(usage.twice).toEqual(['']);
    });

    it('should scan arrays and objects deeply', () => {
      const tpl: JSONValue = ['no vars', { a: '{{ ctx.alpha[1].x }}' }, { b: ['text', '{{ ctx.beta.y }}'] }];
      const usage = extractUsedVariablePaths(tpl);
      expect(usage.alpha).toEqual(['[1].x']);
      expect(usage.beta).toEqual(['y']);
    });

    it('should handle whitespaces inside placeholders', () => {
      const tpl: JSONValue = { a: '{{  ctx.user.name  }}' };
      const usage = extractUsedVariablePaths(tpl);
      expect(usage.user).toEqual(['name']);
    });
  });
});
