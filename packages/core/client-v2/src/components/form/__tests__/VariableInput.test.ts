/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import {
  formatVariablePath,
  makeFormatVariablePath,
  makeParseVariablePath,
  makeVariableRegExp,
  parseVariablePath,
} from '../VariableInput';

describe('VariableInput delimiter helpers', () => {
  describe('default delimiters {{ }}', () => {
    it('formats meta nodes into `{{x.y}}` with no inner spaces', () => {
      expect(formatVariablePath({ paths: ['$user', 'id'] } as any)).toBe('{{$user.id}}');
    });

    it('parses `{{x.y}}` into a path array', () => {
      expect(parseVariablePath('{{ $user.id }}')).toEqual(['$user', 'id']);
      expect(parseVariablePath('{{$user.id}}')).toEqual(['$user', 'id']);
    });

    it('strips a legacy `ctx.` prefix for backwards-compat', () => {
      expect(parseVariablePath('{{ctx.$user.id}}')).toEqual(['$user', 'id']);
      expect(parseVariablePath('{{ctx}}')).toEqual([]);
    });

    it('returns undefined for plain text', () => {
      expect(parseVariablePath('hello world')).toBeUndefined();
      expect(parseVariablePath('')).toBeUndefined();
      expect(parseVariablePath(undefined)).toBeUndefined();
    });
  });

  describe('triple-brace delimiters {{{ }}}', () => {
    const format = makeFormatVariablePath(['{{{', '}}}']);
    const parse = makeParseVariablePath(['{{{', '}}}']);

    it('formats meta nodes into `{{{x.y}}}`', () => {
      expect(format({ paths: ['$user', 'id'] } as any)).toBe('{{{$user.id}}}');
    });

    it('parses `{{{x.y}}}` into a path array', () => {
      expect(parse('{{{$user.id}}}')).toEqual(['$user', 'id']);
      expect(parse('{{{ $user.id }}}')).toEqual(['$user', 'id']);
    });

    it('does not match the double-brace form', () => {
      expect(parse('{{$user.id}}')).toBeUndefined();
    });
  });

  describe('makeVariableRegExp', () => {
    it('matches every occurrence in a longer string under default delimiters', () => {
      const re = makeVariableRegExp();
      const matches = Array.from('hello {{ $user.id }} world {{ $env.X }}'.matchAll(re)).map((m) => m[1]);
      expect(matches).toEqual(['$user.id', '$env.X']);
    });

    it('matches triple-brace occurrences when configured', () => {
      const re = makeVariableRegExp(['{{{', '}}}']);
      const matches = Array.from('hi {{{$user.id}}} :)'.matchAll(re)).map((m) => m[1]);
      expect(matches).toEqual(['$user.id']);
    });

    it('does not match double-brace occurrences under triple-brace config', () => {
      const re = makeVariableRegExp(['{{{', '}}}']);
      const matches = Array.from('plain {{ x }} text'.matchAll(re));
      expect(matches).toHaveLength(0);
    });
  });

  it('handles empty paths consistently', () => {
    expect(formatVariablePath({ paths: [] } as any)).toBeUndefined();
    expect(formatVariablePath(undefined)).toBeUndefined();
    expect(makeFormatVariablePath(['{{{', '}}}'])({ paths: [] } as any)).toBeUndefined();
  });
});
