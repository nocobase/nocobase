/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { maxPathLength } from '../../shared/constants';
import { VscError } from '../../shared/errors';
import { sha256Hex } from '../../shared/hash';
import { normalizePath, pathHash, pathLowerHash } from '../../shared/path';
import { normalizeText } from '../../shared/text';

describe('vsc-file shared utilities', () => {
  it('normalizes paths to POSIX separators without changing case', () => {
    expect(normalizePath('src\\Foo.ts')).toBe('src/Foo.ts');
  });

  it.each(['/a.ts', '../a.ts', './a.ts', 'a/./b.ts', 'a/../../b.ts', 'a//b.ts', 'a/\0/b.ts', 'a/'])(
    'rejects invalid path %s',
    (input) => {
      expect(() => normalizePath(input)).toThrowError(VscError);
      try {
        normalizePath(input);
      } catch (error) {
        expect(error).toMatchObject({ code: 'PATH_INVALID' });
      }
    },
  );

  it('rejects empty and over-limit paths', () => {
    expect(() => normalizePath('')).toThrowError(VscError);
    expect(() => normalizePath('a'.repeat(maxPathLength + 1))).toThrowError(VscError);
  });

  it('uses case-sensitive path hashes and case-insensitive lower hashes', () => {
    expect(pathHash('Foo.ts')).not.toBe(pathHash('foo.ts'));
    expect(pathLowerHash('Foo.ts')).toBe(pathLowerHash('foo.ts'));
  });

  it('normalizes CRLF, CR, and UTF-8 BOM without trimming whitespace', () => {
    expect(normalizeText('\ufeff a\r\nb\rc\n ')).toBe(' a\nb\nc\n ');
  });

  it('rejects text containing NUL with TEXT_ENCODING_INVALID', () => {
    expect(() => normalizeText('a\0b')).toThrowError(VscError);
    try {
      normalizeText('a\0b');
    } catch (error) {
      expect(error).toMatchObject({ code: 'TEXT_ENCODING_INVALID' });
    }
  });

  it('computes SHA-256 hex digests', () => {
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});
